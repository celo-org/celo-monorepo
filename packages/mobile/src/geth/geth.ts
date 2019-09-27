import { GenesisBlockUtils, StaticNodeUtils } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import * as RNFS from 'react-native-fs'
import RNGeth from 'react-native-geth'
import config from 'src/geth/network-config'
import Logger from 'src/utils/Logger'
import FirebaseLogUploader from 'src/utils/LogUploader'
import { DEFAULT_TESTNET } from 'src/web3/testnets'

let gethLock = false
let gethInstance: typeof RNGeth | null = null
const currentNetworkName = DEFAULT_TESTNET
const currentConfig: any = config[currentNetworkName]

export const FailedToFetchStaticNodesError = new Error(
  'Failed to fetch static nodes from Google storage'
)
export const FailedToFetchGenesisBlockError = new Error(
  'Failed to fetch genesis block from Google storage'
)

// We are never going to run mobile node in full or fast mode.
enum SyncMode {
  LIGHT = 'light',
  ULTRA_LIGHT = 'ultralight',
}

// Log levels correpond to the values defined in
// https://github.com/celo-org/geth/blob/master/log/logger.go#L21
enum LogLevel {
  CRITICAL = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}

// The logs will be uploaded only if they are larger than this size
const UPLOAD_SIZE_THRESHOLD = 10 * 1024 // 10 KB

enum ErrorType {
  Unknown,
  GethAlreadyRunning,
  CorruptChainData,
}

// Must match `clientIdentifier`
// see https://github.com/celo-org/celo-blockchain/blob/d4b48f3e79b01e8cb7dcf8606b0ed1f666a37a2f/mobile/geth.go#L143
// and https://github.com/celo-org/celo-blockchain/blob/d4b48f3e79b01e8cb7dcf8606b0ed1f666a37a2f/mobile/geth_android.go
const INSTANCE_FOLDER = Platform.select({
  ios: 'iGeth',
  android: 'GethDroid',
  default: 'GethMobile',
})

function getNodeInstancePath(nodeDir: string) {
  return `${RNFS.DocumentDirectoryPath}/${nodeDir}/${INSTANCE_FOLDER}`
}

function getFolder(filePath: string) {
  return filePath.substr(0, filePath.lastIndexOf('/'))
}

async function createNewGeth(): Promise<typeof RNGeth> {
  Logger.debug('Geth@newGeth', 'Configure and create new Geth')
  const { nodeDir, syncMode } = currentConfig
  const genesis: string = await readGenesisBlockFile(nodeDir)
  const networkID: number = GenesisBlockUtils.getChainIdFromGenesis(genesis)

  Logger.debug('Geth@newGeth', `Network ID is ${networkID}`)

  const gethOptions: any = {
    nodeDir,
    networkID,
    genesis,
    syncMode,
    useLightweightKDF: true,
  }

  // Setup Logging
  const logFilePath = Logger.getGethLogFilePath()

  // Upload logs first
  await uploadLogs(logFilePath, Logger.getReactNativeLogsFilePath())
  gethOptions.logFile = logFilePath
  // Only log info and above to the log file.
  // The logcat logging mode remains unchanged.
  gethOptions.logFileLogLevel = LogLevel.INFO
  Logger.debug('Geth@newGeth', 'Geth logs will be piped to ' + logFilePath)

  return new RNGeth(gethOptions)
}

async function initGeth() {
  Logger.info('Geth@init', 'Create a new Geth instance')

  if (gethLock) {
    Logger.warn('Geth@init', 'Geth create already in progress.')
    return
  }
  gethLock = true

  try {
    if (gethInstance) {
      Logger.debug('Geth@init', 'Geth already exists, trying to stop it.')
      await stop()
    }

    if (!(await ensureGenesisBlockWritten())) {
      throw FailedToFetchGenesisBlockError
    }
    if (!(await ensureStaticNodesInitialized())) {
      throw FailedToFetchStaticNodesError
    }
    const geth = await createNewGeth()

    try {
      await geth.start()
      gethInstance = geth
      geth.subscribeNewHead()
    } catch (e) {
      const errorType = getGethErrorType(e)
      if (errorType === ErrorType.GethAlreadyRunning) {
        // Geth is already running, this is most likely RN restart.
        Logger.info('Geth@init/startInstance', 'Geth start reported geth already running')
        // Note: Unfortunately, RN-Geth doesn't currently support connecting to the
        // already running geth instance, which we would need to subscribe to head updates.
        // In the meantime, we need to force an app reset. See #3227
        throw new Error('Geth already running, need to restart app')
      } else if (errorType === ErrorType.CorruptChainData) {
        Logger.warn('Geth@init/startInstance', 'Geth start reported chain data error')
        attemptGethCorruptionFix(geth)
      } else {
        Logger.error('Geth@init/startInstance', 'Unexpected error starting geth', e)
        throw e
      }
    }
  } finally {
    gethLock = false
  }
}

export async function getGeth(): Promise<typeof gethInstance> {
  Logger.debug('Geth@getGeth', 'Getting Geth Instance')
  if (!gethInstance) {
    await initGeth()
  }
  return gethInstance
}

async function ensureStaticNodesInitialized(): Promise<boolean> {
  const { nodeDir } = currentConfig
  if (await staticNodesAlreadyInitialized(nodeDir)) {
    Logger.debug('Geth@maybeInitStaticNodes', 'static nodes already initialized')
    return true
  } else {
    Logger.debug('Geth@maybeInitStaticNodes', 'initializing static nodes')
    let enodes: string | null = null
    try {
      enodes = await StaticNodeUtils.getStaticNodesAsync(currentNetworkName)
    } catch (error) {
      Logger.error(
        `Failed to get static nodes for network ${currentNetworkName},` +
          `the node will not be able to sync with the network till restart`,
        error
      )
      return false
    }
    if (enodes != null) {
      await writeStaticNodes(nodeDir, enodes)
      return true
    }
    return false
  }
}

async function stop() {
  try {
    Logger.debug('Geth@stop', 'Stopping Geth')
    await gethInstance.stop()
    Logger.debug('Geth@stop', 'Geth stopped')
  } catch (e) {
    Logger.error('Geth@stop', 'Error stopping Geth', e)
    throw e
  }
}

async function ensureGenesisBlockWritten(): Promise<boolean> {
  const { nodeDir } = currentConfig
  if (await genesisBlockAlreadyWritten(nodeDir)) {
    Logger.debug('Geth@ensureGenesisBlockWritten', 'genesis block already written')
    return true
  } else {
    Logger.debug('Geth@ensureGenesisBlockWritten', 'writing genesis block')
    let genesisBlock: string | null = null
    try {
      genesisBlock = await GenesisBlockUtils.getGenesisBlockAsync(currentNetworkName)
    } catch (error) {
      Logger.error(`Failed to get the genesis block for network ${currentNetworkName}.`, error)
      return false
    }
    if (genesisBlock != null) {
      await writeGenesisBlock(nodeDir, genesisBlock)
      return true
    }
    return false
  }
}

function getGenesisBlockFile(nodeDir: string) {
  return `${getNodeInstancePath(nodeDir)}/genesis.json`
}

async function genesisBlockAlreadyWritten(nodeDir: string): Promise<boolean> {
  const genesisBlockFile = getGenesisBlockFile(nodeDir)
  if (!(await RNFS.exists(genesisBlockFile))) {
    return false
  }
  const fileStat: RNFS.StatResult = await RNFS.stat(genesisBlockFile)
  return fileStat.isFile() && new BigNumber(fileStat.size, 10).isGreaterThan(0)
}

async function readGenesisBlockFile(nodeDir: string): Promise<string> {
  const genesisBlockFile = getGenesisBlockFile(nodeDir)
  return RNFS.readFile(genesisBlockFile, { encoding: 'utf8' })
}

async function writeGenesisBlock(nodeDir: string, genesisBlock: string) {
  Logger.debug(`writeGenesisBlock genesis block is: "${genesisBlock}"`)
  const genesisBlockFile = getGenesisBlockFile(nodeDir)
  await RNFS.mkdir(getFolder(genesisBlockFile))
  await RNFS.writeFile(genesisBlockFile, genesisBlock, 'utf8')
}

function getStaticNodesFile(nodeDir: string) {
  return `${getNodeInstancePath(nodeDir)}/static-nodes.json`
}

/**
 * Returns true if the static nodes files in the Geth data dir has been initialized, false otherwise.
 * @param nodeDir Geth data dir
 */
async function staticNodesAlreadyInitialized(nodeDir: string): Promise<boolean> {
  const staticNodesFile = getStaticNodesFile(nodeDir)
  if (!(await RNFS.exists(staticNodesFile))) {
    return false
  }
  const fileStat: RNFS.StatResult = await RNFS.stat(staticNodesFile)
  return fileStat.isFile() && new BigNumber(fileStat.size, 10).isGreaterThan(0)
}

async function writeStaticNodes(nodeDir: string, enodes: string) {
  console.info(`writeStaticNodes enodes are "${enodes}"`)
  const staticNodesFile = getStaticNodesFile(nodeDir)
  await RNFS.mkdir(getFolder(staticNodesFile))
  await RNFS.writeFile(staticNodesFile, enodes, 'utf8')
}

async function attemptGethCorruptionFix(geth: any) {
  const deleteChainDataResult = await deleteChainData()
  const deleteGethLockResult = await deleteGethLockFile()
  if (deleteChainDataResult && deleteGethLockResult) {
    await geth.start()
    gethInstance = geth
    geth.subscribeNewHead()
  } else {
    throw new Error('Failed to fix Geth and restart')
  }
}

export async function deleteChainData() {
  Logger.debug('Geth@deleteChainData', 'Deleting chain data')
  // Delete data for both the possible modes a mobile node could be running in.
  const result1 = await deleteSingleChainData(SyncMode.ULTRA_LIGHT)
  const result2 = await deleteSingleChainData(SyncMode.LIGHT)
  return result1 || result2
}

async function deleteSingleChainData(syncMode: SyncMode) {
  const { nodeDir } = currentConfig
  const chainDataDir = `${getNodeInstancePath(nodeDir)}/${syncMode}chaindata`
  Logger.debug('Geth@deleteSingleChainData', `Going to delete ${chainDataDir}`)
  return deleteFileIfExists(chainDataDir)
}

async function deleteGethLockFile() {
  // Delete the .ipc file or the Geth will think that some other Geth node is using this datadir.
  const { nodeDir } = currentConfig
  const gethLockFile = `${getNodeInstancePath(nodeDir)}/LOCK`
  Logger.info('Geth@deleteGethLockFile', `Deleting ${gethLockFile} for nodeDir ${nodeDir}`)
  return deleteFileIfExists(gethLockFile)
}

async function deleteFileIfExists(path: string) {
  try {
    const gethLockFileExists = await RNFS.exists(path)
    if (gethLockFileExists) {
      Logger.debug('Geth@deleteFileIfExists', `Dir ${path} exists. Attempting to delete`)
      await RNFS.unlink(path)
      return true
    } else {
      Logger.debug('Geth@deleteFileIfExists', `Dir ${path} does not exist`)
      return true
    }
  } catch (error) {
    Logger.error('Geth@deleteFileIfExists', `Failed to delete ${path}`, error)
    return false
  }
}

// The only reason to upload both the logs simulatenously here is to have the same upload ID for both, so that,
// the developers can correlate them.
async function uploadLogs(gethLogFilePath: string, reactNativeLogFilePath: string) {
  Logger.debug('Geth@uploadLogs', 'Attempting to upload geth logs')
  try {
    const bundleId = DeviceInfo.getBundleId()
    const uploadPath = `${bundleId}/${DEFAULT_TESTNET}`

    // Phone number might not be verified here but that does not matter for logging.
    const phoneNumber = (await DeviceInfo.getPhoneNumber()) || 'unknown'
    const timestamp = new Date().getTime()
    const deviceId = DeviceInfo.getUniqueID()
    const uploadId = `${timestamp}_${deviceId}`
    const gethUploadFileName = `${phoneNumber}_${uploadId}_geth.txt`
    const reactNativeUploadFileName = `${phoneNumber}_${uploadId}_rn.txt`
    // Upload one if the other one is uploaded.

    const [shouldUploadGeth, shouldUploadRN] = await Promise.all([
      FirebaseLogUploader.shouldUpload(gethLogFilePath, UPLOAD_SIZE_THRESHOLD, true),
      FirebaseLogUploader.shouldUpload(reactNativeLogFilePath, UPLOAD_SIZE_THRESHOLD, true),
    ])

    // If either of them have to be uploaded then upload both.
    // Noth that the Wi-Fi can switch to cellular between the time of check and
    // the time of use but at this time that's an acceptable tradeoff.
    if (shouldUploadGeth || shouldUploadRN) {
      await Promise.all([
        FirebaseLogUploader.upload(gethLogFilePath, uploadPath, gethUploadFileName),
        FirebaseLogUploader.upload(reactNativeLogFilePath, uploadPath, reactNativeUploadFileName),
      ])
    }
  } catch (e) {
    Logger.error('Geth@uploadLogs', 'Failed to upload logs', e)
  }
}

function getGethErrorType(e: Error): ErrorType {
  if (!e || !e.message) {
    return ErrorType.Unknown
  }
  if (e.message.includes('datadir already used by another process')) {
    return ErrorType.GethAlreadyRunning
  }
  if (e.message.includes('missing block number for head header hash')) {
    return ErrorType.CorruptChainData
  }
  return ErrorType.Unknown
}
