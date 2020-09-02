import { GenesisBlockUtils, StaticNodeUtils } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import * as RNFS from 'react-native-fs'
import GethBridge, { NodeConfig } from 'react-native-geth'
import { GethEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { DEFAULT_TESTNET, GETH_START_HTTP_RPC_SERVER } from 'src/config'
import { SYNCING_MAX_PEERS } from 'src/geth/consts'
import networkConfig from 'src/geth/networkConfig'
import Logger from 'src/utils/Logger'
import FirebaseLogUploader from 'src/utils/LogUploader'

let gethLock = false
let gethInitialized = false

export const FailedToFetchStaticNodesError = new Error(
  'Failed to fetch static nodes from Google storage'
)
export const FailedToFetchGenesisBlockError = new Error(
  'Failed to fetch genesis block from Google storage'
)

export const PROVIDER_CONNECTION_ERROR = "connection error: couldn't connect to node"

// We are never going to run mobile node in full or fast mode.
enum SyncMode {
  LIGHT = 'light',
  LIGHTEST = 'lightest',
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
  ios: 'celoios',
  android: 'celoandroid',
  default: 'celomobile',
})

// Use relative path on iOS to workaround the 104 chars path limit for unix domain socket.
// On iOS the default path would be something like
// `/var/mobile/Containers/Data/Application/2E684E03-9EFA-492A-B19A-4759DD32BE67/Documents/.alfajores/geth.ipc`
// which is too long.
// So on iOS, `react-native-geth` changes the current directory to `${DocumentDirectoryPath}/.${DEFAULT_TESTNET}`
// for the relative path workaround to work.
export const IPC_PATH =
  Platform.OS === 'ios'
    ? './geth.ipc'
    : `${RNFS.DocumentDirectoryPath}/.${DEFAULT_TESTNET}/geth.ipc`

function getNodeInstancePath(nodeDir: string) {
  return `${RNFS.DocumentDirectoryPath}/${nodeDir}/${INSTANCE_FOLDER}`
}

function getFolder(filePath: string) {
  return filePath.substr(0, filePath.lastIndexOf('/'))
}

async function setupGeth(sync: boolean = true, bootnodeEnodes: string[]): Promise<boolean> {
  Logger.debug('Geth@newGeth', 'Configure and create new Geth')
  const { nodeDir, useDiscovery, syncMode } = networkConfig
  const genesis: string = await readGenesisBlockFile(nodeDir)
  const networkID: number = GenesisBlockUtils.getChainIdFromGenesis(genesis)

  Logger.debug('Geth@newGeth', `Network ID is ${networkID}, syncMode is ${syncMode}`)

  const maxPeers = sync ? SYNCING_MAX_PEERS : 0

  let gethOptions: NodeConfig = {
    nodeDir,
    networkID,
    genesis,
    syncMode,
    maxPeers,
    useLightweightKDF: true,
    ipcPath: IPC_PATH,
    noDiscovery: !useDiscovery,
  }

  if (useDiscovery) {
    Logger.debug('Geth@newGeth', 'Using discovery, bootnodes = ' + bootnodeEnodes)
    gethOptions.bootnodeEnodes = bootnodeEnodes
  }

  if (__DEV__ && GETH_START_HTTP_RPC_SERVER) {
    Logger.debug('Geth@newGeth', 'Starting HTTP RPC server')
    gethOptions = {
      ...gethOptions,
      httpHost: '0.0.0.0',
      httpPort: 8545,
      httpVirtualHosts: '*',
      httpModules: 'admin,debug,eth,istanbul,les,net,rpc,txpool,web3',
    }
  }

  // Setup Logging
  const gethLogFilePath = Logger.getGethLogFilePath()

  // Upload logs first
  await uploadLogs(gethLogFilePath, Logger.getReactNativeLogsFilePath())
  gethOptions.logFile = gethLogFilePath
  // Only log info and above to the log file.
  // The logcat logging mode remains unchanged.
  gethOptions.logFileLogLevel = LogLevel.INFO
  Logger.debug('Geth@newGeth', 'Geth logs will be piped to ' + gethLogFilePath)
  return GethBridge.setConfig(gethOptions)
}

export async function initGeth(shouldStartNode: boolean = true): Promise<boolean> {
  ValoraAnalytics.track(GethEvents.geth_init_start, { shouldStartNode })
  Logger.info('Geth@init', `Create a new Geth instance with shouldStartNode=${shouldStartNode}`)

  if (gethLock) {
    Logger.warn('Geth@init', 'Geth create already in progress.')
    return false
  }
  gethLock = true

  const { useDiscovery, useStaticNodes } = networkConfig

  try {
    let staticNodes: string[] = []
    await Promise.all([
      ensureGenesisBlockWritten().then((ok) => {
        if (!ok) {
          throw FailedToFetchGenesisBlockError
        }
      }),
      (async () => {
        if (shouldStartNode && (useDiscovery || useStaticNodes)) {
          staticNodes = await getStaticNodes()
        }
        Logger.info('Geth@init', `Got static nodes: ${staticNodes}`)
        return initializeStaticNodesFile(useStaticNodes ? staticNodes : [])
      })(),
    ])

    ValoraAnalytics.track(GethEvents.create_geth_start)
    try {
      // Use staticNodes as bootnodes because they support v4 and v5 discovery,
      // and there are many of them.
      // The dedicated bootnode currently only supports v4.
      await setupGeth(shouldStartNode, staticNodes)
    } catch (error) {
      ValoraAnalytics.track(GethEvents.create_geth_error, { error: error.message })
      throw error
    }
    ValoraAnalytics.track(GethEvents.create_geth_finish)
    gethInitialized = true

    if (shouldStartNode) {
      try {
        ValoraAnalytics.track(GethEvents.start_geth_start)
        await GethBridge.startNode()
        ValoraAnalytics.track(GethEvents.start_geth_finish)
        await GethBridge.subscribeNewHead()
      } catch (e) {
        const errorType = getGethErrorType(e)
        if (errorType === ErrorType.GethAlreadyRunning) {
          Logger.error('Geth@init/startInstance', 'Geth start reported geth already running')
          throw new Error('Geth already running, need to restart app')
        } else if (errorType === ErrorType.CorruptChainData) {
          Logger.warn('Geth@init/startInstance', 'Geth start reported chain data error')
          await attemptGethCorruptionFix()
        } else {
          Logger.error('Geth@init/startInstance', 'Unexpected error starting geth', e)
          throw e
        }
      }
    }
    return true
  } finally {
    gethLock = false
  }
}

export function isProviderConnectionError(error: any) {
  return error
    ?.toString()
    ?.toLowerCase()
    .includes(PROVIDER_CONNECTION_ERROR)
}

async function getStaticNodes(): Promise<string[]> {
  try {
    const enodesStr = await StaticNodeUtils.getStaticNodesAsync(DEFAULT_TESTNET)
    return JSON.parse(enodesStr)
  } catch (error) {
    Logger.error(
      `Failed to get static nodes for network ${DEFAULT_TESTNET},` +
        `the node will not be able to sync with the network till restart`,
      error
    )
    throw FailedToFetchStaticNodesError
  }
}

// Writes static nodes to the correct location
async function initializeStaticNodesFile(staticNodes: string[]): Promise<void> {
  const { nodeDir } = networkConfig
  Logger.debug('Geth@initializeStaticNodesFile', 'initializing static nodes')
  return writeStaticNodes(nodeDir, JSON.stringify(staticNodes))
}

export async function stopGethIfInitialized() {
  if (gethInitialized) {
    await stop()
  }
}

async function stop() {
  try {
    Logger.debug('Geth@stop', 'Stopping Geth')
    await GethBridge.stopNode()
    Logger.debug('Geth@stop', 'Geth stopped')
  } catch (e) {
    Logger.error('Geth@stop', 'Error stopping Geth', e)
    throw e
  }
}

async function ensureGenesisBlockWritten(): Promise<boolean> {
  const { nodeDir } = networkConfig
  if (await genesisBlockAlreadyWritten(nodeDir)) {
    Logger.debug('Geth@ensureGenesisBlockWritten', 'genesis block already written')
    return true
  } else {
    Logger.debug('Geth@ensureGenesisBlockWritten', 'writing genesis block')
    let genesisBlock: string | null = null
    try {
      genesisBlock = await GenesisBlockUtils.getGenesisBlockAsync(DEFAULT_TESTNET)
    } catch (error) {
      Logger.error(`Failed to get the genesis block for network ${DEFAULT_TESTNET}.`, error)
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

async function writeStaticNodes(nodeDir: string, enodes: string) {
  Logger.info('Geth@writeStaticNodes', `enodes are "${enodes}"`)
  const staticNodesFile = getStaticNodesFile(nodeDir)
  Logger.info('Geth@writeStaticNodes', `static nodes file is ${staticNodesFile}"`)
  await RNFS.mkdir(getFolder(staticNodesFile))
  await deleteFileIfExists(staticNodesFile)
  await RNFS.writeFile(staticNodesFile, enodes, 'utf8')
}

async function attemptGethCorruptionFix() {
  const deleteChainDataResult = await deleteChainData()
  const deleteGethLockResult = await deleteGethLockFile()
  if (deleteChainDataResult && deleteGethLockResult) {
    await GethBridge.startNode()
    await GethBridge.subscribeNewHead()
  } else {
    throw new Error('Failed to fix Geth and restart')
  }
}

export async function deleteChainData() {
  Logger.debug('Geth@deleteChainData', 'Deleting chain data')
  // Delete data for both the possible modes a mobile node could be running in.
  const result1 = await deleteSingleChainData(SyncMode.LIGHTEST)
  const result2 = await deleteSingleChainData(SyncMode.LIGHT)
  return result1 || result2
}

async function deleteSingleChainData(syncMode: SyncMode) {
  const { nodeDir } = networkConfig
  const chainDataDir = `${getNodeInstancePath(nodeDir)}/${syncMode}chaindata`
  Logger.debug('Geth@deleteSingleChainData', `Going to delete ${chainDataDir}`)
  return deleteFileIfExists(chainDataDir)
}

export async function deleteNodeData() {
  const { nodeDir } = networkConfig
  const dataDir = `${RNFS.DocumentDirectoryPath}/${nodeDir}`
  Logger.debug('Geth@deleteNodeData', `Going to delete ${dataDir}`)
  return deleteFileIfExists(dataDir)
}

async function deleteGethLockFile() {
  // Delete the .ipc file or the Geth will think that some other Geth node is using this datadir.
  const { nodeDir } = networkConfig
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

    const timestamp = new Date().getTime()
    const deviceId = DeviceInfo.getUniqueId()
    const gethUploadFileName = `${deviceId}_${timestamp}_geth.txt`
    const reactNativeUploadFileName = `${deviceId}_${timestamp}_rn.txt`
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
