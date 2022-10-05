import { timeout } from '@celo/base'
import { Block } from '@celo/connect'
import { ContractKit, newKit } from '@celo/contractkit'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { FileKeystore, KeystoreWalletWrapper } from '@celo/keystores'
import { eqAddress } from '@celo/utils/lib/address'
import Logger from 'bunyan'
import moment from 'moment'
import { FindOptions, Op, Sequelize, Transaction } from 'sequelize'
import {
  fetchEnv,
  fetchEnvOrDefault,
  getAccountAddress,
  getAttestationSignerAddress,
  getCeloProviders,
  isYes,
} from './env'
import { rootLogger } from './logger'
import { Gauges } from './metrics'
import Attestation, {
  AttestationKey,
  AttestationModel,
  AttestationStatic,
} from './models/attestation'
import { ErrorMessages } from './request'

export let sequelize: Sequelize | undefined

let dbRecordExpiryMins: number | null

const maxAgeLatestBlock: number = parseInt(fetchEnvOrDefault('MAX_AGE_LATEST_BLOCK_SECS', '20'), 10)
const getBlockTimeout = parseInt(fetchEnvOrDefault('GET_BLOCK_TIMEOUT_MS', '500'), 10)

// Process these once instead of at each reinitialization of the kits
const celoProviders = getCeloProviders()
const smartFallback = !isYes(fetchEnvOrDefault('DISABLE_SMART_FALLBACK', 'false'))
const keystoreDirpath = fetchEnvOrDefault('ATTESTATION_SIGNER_KEYSTORE_DIRPATH', '')
const keystorePassphrase = fetchEnvOrDefault('ATTESTATION_SIGNER_KEYSTORE_PASSPHRASE', '')
const signerAddress = fetchEnv('ATTESTATION_SIGNER_ADDRESS')

export type SequelizeLogger = boolean | ((sql: string, timing?: number) => void)

export function makeSequelizeLogger(logger: Logger): SequelizeLogger {
  return (msg: string, sequelizeLogArgs: any) =>
    logger.debug({ sequelizeLogArgs, component: 'sequelize' }, msg)
}

export async function initializeDB() {
  if (sequelize === undefined) {
    sequelize = new Sequelize(fetchEnv('DATABASE_URL'), {
      logging: makeSequelizeLogger(rootLogger),
    })
    rootLogger.info('Initializing Database')
    await sequelize.authenticate()

    // Check four times every `dbRecordExpiryMins` period to delete records older than dbRecordExpiryMins
    dbRecordExpiryMins = parseInt(fetchEnvOrDefault('DB_RECORD_EXPIRY_MINS', '60'), 10)
    const dbRecordExpiryCheckEveryMs = dbRecordExpiryMins * 15 * 1000
    setInterval(purgeExpiredRecords, dbRecordExpiryCheckEveryMs)
  }
}

export function isDBOnline() {
  if (sequelize === undefined) {
    return initializeDB()
  } else {
    return sequelize.authenticate() as Promise<void>
  }
}

const kits = new Array<ContractKit | undefined>(celoProviders.length).fill(undefined)

/**
 * Decorator to wrap execution of f
 * with an optional prioritization of kit1 and kit2
 * and retry logic if execution with the first kit fails
 * @param f function to execute
 * @param kit1 primary kit instance
 * @param kit2 optional secondary kit instance
 * @returns f(kit)
 */
async function execWithFallback<T>(
  f: (kit: ContractKit) => T,
  kit1: ContractKit,
  kit2?: ContractKit | undefined
): Promise<T> {
  let primaryKit = kit1
  let secondaryKit = kit2
  // Check if backup kit is ahead of primary kit; change prioritization as such
  if (
    smartFallback &&
    kit2 &&
    // Prioritize block age over syncing/not; avoids complex checks for stalls
    // and assumes that if one is stalled, the next block number check will correct this.
    (!kit1 ||
      (await getAgeOfLatestBlockFromKit(kit2)).number >
        (await getAgeOfLatestBlockFromKit(kit1)).number)
  ) {
    rootLogger.info('Prioritizing a backup provider')
    primaryKit = kit2
    secondaryKit = kit1
  }
  try {
    return await f(primaryKit)
  } catch (error) {
    rootLogger.warn(`Using ContractKit failed: ${error}`)
    if (secondaryKit) {
      rootLogger.info(`Attempting to use secondary ContractKit`)
      return f(secondaryKit!)
    } else {
      throw error
    }
  }
}

export async function useKit<T>(f: (kit: ContractKit) => T): Promise<T> {
  let usableKits = kits.filter((k) => k !== undefined)

  const reinitAndRetry = async () => {
    await initializeKits(true)
    usableKits = kits.filter((k) => k !== undefined)
    return execWithFallback(f, usableKits[0]!, usableKits[1])
  }

  if (!usableKits.length) {
    // This throws an error if no kits are initialized
    return reinitAndRetry()
  } else {
    try {
      return await execWithFallback(f, usableKits[0]!, usableKits[1])
    } catch (error) {
      return reinitAndRetry()
    }
  }
}

async function isNodeSyncingFromKit(k: ContractKit) {
  const syncProgress = await k.isSyncing()
  return typeof syncProgress === 'boolean' && syncProgress
}

export async function isNodeSyncing() {
  return useKit(isNodeSyncingFromKit)
}

export async function getAgeOfLatestBlockFromKit(k: ContractKit) {
  try {
    return await timeout(
      async () => {
        let latestBlock: Block
        try {
          // Differentiate between errors with getBlock and timeouts
          latestBlock = await k!.connection.getBlock('latest')
        } catch (error: any) {
          throw new Error(`Error fetching latest block: ${error.message}`)
        }
        const ageOfLatestBlock = Date.now() / 1000 - Number(latestBlock.timestamp)
        return {
          ageOfLatestBlock,
          number: latestBlock.number,
        }
      },
      [],
      getBlockTimeout,
      new Error(`Timeout fetching block after ${getBlockTimeout} ms`)
    )
  } catch (error: any) {
    rootLogger.warn(error.message)
    // On failure return values that should always be comparatively out-of-date
    return {
      ageOfLatestBlock: maxAgeLatestBlock + 1,
      number: -1,
    }
  }
}

export async function getAgeOfLatestBlock() {
  return useKit(getAgeOfLatestBlockFromKit)
}

export async function isAttestationSignerUnlocked() {
  // The only way to see if a key is unlocked is to try to sign something
  try {
    await useKit((k) => k.connection.sign('DO_NOT_USE', getAttestationSignerAddress()))
    return true
  } catch {
    return false
  }
}

// Verify a signer and validator address are provided, are valid, match the on-chain signer,
// that signer account is unlocked, that metadata is accessible and valid and that the
// attestationServiceURL claim is present in the metadata (external name/port may be
// different to instance, so we cannot validate its details)
export async function verifyConfigurationAndGetURL() {
  const signer = getAttestationSignerAddress()
  const validator = getAccountAddress()

  const accounts = await useKit((k) => k.contracts.getAccounts())
  if (!(await accounts.isAccount(validator))) {
    throw Error(`${validator} is not registered as an account!`)
  }

  if (!(await accounts.hasAuthorizedAttestationSigner(validator))) {
    throw Error(`No attestation signer authorized for ${validator}!`)
  }

  const signerOnChain = await accounts.getAttestationSigner(validator)
  if (!eqAddress(signerOnChain, signer)) {
    throw Error(
      `Different attestation signer in config ${signer} than on-chain ${signerOnChain} for ${validator}!`
    )
  }

  if (!(await isAttestationSignerUnlocked())) {
    throw Error(`Need to unlock attestation signer account ${signer}`)
  }

  const metadataURL = await accounts.getMetadataURL(validator)
  try {
    const metadata = await IdentityMetadataWrapper.fetchFromURL(accounts, metadataURL)
    const claim = metadata.findClaim(ClaimTypes.ATTESTATION_SERVICE_URL)
    if (!claim) {
      throw Error('Missing ATTESTATION_SERVICE_URL claim')
    }
    return claim.url
  } catch (error) {
    throw Error(`Could not verify metadata at ${metadataURL}: ${error}`)
  }
}

/**
 * Function to initialize each kit in the global array of Contract Kit(s)
 * @param force if true, reinitialize kit(s) whether or not they already exist
 */
export async function initializeKits(force: boolean = false) {
  rootLogger.info('Initializing Contract Kit(s)')
  let keystoreWalletWrapper: KeystoreWalletWrapper | undefined
  // Prefer to use keystore if these variables are set
  if (keystoreDirpath && keystorePassphrase) {
    keystoreWalletWrapper = new KeystoreWalletWrapper(new FileKeystore(keystoreDirpath))
    try {
      await keystoreWalletWrapper.unlockAccount(signerAddress, keystorePassphrase)
    } catch (error: any) {
      throw new Error(
        `Unlocking keystore file for account ${signerAddress} failed: ` + error.message
      )
    }
  }

  const failedConnections = await Promise.all(
    kits.map(async (kit, i) => {
      // Return whether kit_i fails to connect to the given provider
      if (kit === undefined || force) {
        try {
          kits[i] = keystoreWalletWrapper
            ? newKit(celoProviders[i], keystoreWalletWrapper.getLocalWallet())
            : newKit(celoProviders[i])
          // Copied from @celo/cli/src/utils/helpers
          await kits[i]!.connection.getBlock('latest')
          rootLogger.info(`Connected to Celo node at ${celoProviders[i]}`)
          return false
        } catch (error) {
          kits[i] = undefined
          rootLogger.warn(`Failed to connect to Celo node at ${celoProviders[i]}`)
          return true
        }
      }
    })
  )
  // No kits successfully reinitialized nor existing kits that work
  if (failedConnections && failedConnections.filter(Boolean).length === kits.length) {
    throw new Error(`Initializing ContractKit failed for all providers: ${celoProviders}.`)
  }
}

export async function startPeriodicHealthCheck() {
  await tryHealthCheck()
  setInterval(tryHealthCheck, 60 * 1000)
}

export async function startPeriodicKitsCheck() {
  // Cover the edge case where one kit is set to undefined,
  // causing prioritization logic to always default to the other kits
  // without reinitializing this kit.
  const checkUndefinedKits = async () => {
    if (kits.filter((k) => k !== undefined).length < kits.length) {
      // Only attempt to reinitialize undefined kits
      try {
        await initializeKits(false)
      } catch (error: any) {
        rootLogger.error(`Periodic kits check failed: ${error.message}`)
      }
    }
  }
  setInterval(checkUndefinedKits, 60 * 1000)
}

let AttestationTable: AttestationStatic

async function getAttestationTable() {
  if (AttestationTable) {
    return AttestationTable
  }
  AttestationTable = await Attestation(sequelize!)
  return AttestationTable
}

export async function findAttestationByKey(
  key: AttestationKey,
  options: FindOptions = {}
): Promise<AttestationModel | null> {
  return (await getAttestationTable()).findOne({
    where: { ...key },
    ...options,
  })
}

export async function findAttestationByDeliveryId(
  ongoingDeliveryId: string,
  options: FindOptions = {}
): Promise<AttestationModel | null> {
  return (await getAttestationTable()).findOne({
    where: { ongoingDeliveryId },
    // Ensure deterministic result, since deliveryId uniqueness is not enforced
    order: [['createdAt', 'DESC']],
    ...options,
  })
}

export async function findOrCreateAttestation(
  key: AttestationKey,
  defaults: object | undefined,
  transaction: Transaction
): Promise<AttestationModel> {
  const attestationTable = await getAttestationTable()
  await attestationTable.findOrCreate({
    where: {
      ...key,
    },
    defaults,
    transaction,
  })

  // Query to lock the record
  const attestationRecord = await findAttestationByKey(
    {
      ...key,
    },
    { transaction, lock: Transaction.LOCK.UPDATE }
  )

  if (!attestationRecord) {
    // This should never happen
    throw new Error(`Somehow we did not get an attestation record`)
  }

  return attestationRecord
}

async function purgeExpiredRecords() {
  try {
    const sequelizeLogger = makeSequelizeLogger(rootLogger)
    const transaction = await sequelize!.transaction({ logging: sequelizeLogger })
    try {
      const table = await getAttestationTable()
      const rowsDeleted = await table.destroy({
        where: {
          createdAt: {
            [Op.lte]: moment().subtract(dbRecordExpiryMins!, 'minutes').toDate(),
          },
        },
        transaction,
      })
      await transaction.commit()
      if (rowsDeleted) {
        rootLogger.info({ rowsDeleted }, 'Purged expired records')
      }
    } catch (err) {
      rootLogger.error({ err }, 'Cannot purge expired records')
      await transaction.rollback()
    }
  } catch (err) {
    rootLogger.error({ err }, 'Cannot purge expired records')
  }
}

// Do the health check to update the gauge
async function tryHealthCheck() {
  try {
    const failureReason = await doHealthCheck()
    if (failureReason) {
      rootLogger.warn(`Health check failed: ${failureReason}`)
    }
  } catch {
    rootLogger.warn(`Health check failed`)
  }
}

// Check health and return failure reason, null on success.
export async function doHealthCheck(): Promise<string | null> {
  try {
    if (!(await isAttestationSignerUnlocked())) {
      Gauges.healthy.set(0)
      return ErrorMessages.ATTESTATION_SIGNER_CANNOT_SIGN
    }

    if (await isNodeSyncing()) {
      Gauges.healthy.set(0)
      return ErrorMessages.NODE_IS_SYNCING
    }

    const { ageOfLatestBlock } = await getAgeOfLatestBlock()
    if (ageOfLatestBlock > maxAgeLatestBlock) {
      Gauges.healthy.set(0)
      return ErrorMessages.NODE_IS_STUCK
    }

    try {
      await isDBOnline()
    } catch (error) {
      Gauges.healthy.set(0)
      return ErrorMessages.DATABASE_IS_OFFLINE
    }

    Gauges.healthy.set(1)
    return null
  } catch (error) {
    Gauges.healthy.set(0)
    return ErrorMessages.UNKNOWN_ERROR
  }
}
