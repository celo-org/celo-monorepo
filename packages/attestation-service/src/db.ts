import { ContractKit, newKit } from '@celo/contractkit'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { eqAddress } from '@celo/utils/lib/address'
import Logger from 'bunyan'
import moment from 'moment'
import { FindOptions, Op, Sequelize, Transaction } from 'sequelize'
import { fetchEnv, fetchEnvOrDefault, getAccountAddress, getAttestationSignerAddress } from './env'
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

let kit: ContractKit | undefined

// Wrapper that on error tries once to reinitialize connection to node.
export async function useKit<T>(f: (kit: ContractKit) => T): Promise<T> {
  if (!kit) {
    await initializeKit(true)
    // tslint:disable-next-line: no-return-await
    return await f(kit!)
  } else {
    try {
      return await f(kit!)
    } catch (error) {
      await initializeKit(true)
      // tslint:disable-next-line: no-return-await
      return await f(kit!)
    }
  }
}

export async function isNodeSyncing() {
  const syncProgress = await useKit((k) => k.web3.eth.isSyncing())
  return typeof syncProgress === 'boolean' && syncProgress
}

export async function getAgeOfLatestBlock() {
  const latestBlock = await useKit((k) => k.web3.eth.getBlock('latest'))
  const ageOfLatestBlock = Date.now() / 1000 - Number(latestBlock.timestamp)
  return {
    ageOfLatestBlock,
    number: latestBlock.number,
  }
}

export async function isAttestationSignerUnlocked() {
  // The only way to see if a key is unlocked is to try to sign something
  try {
    await useKit((k) => k.web3.eth.sign('DO_NOT_USE', getAttestationSignerAddress()))
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
    const metadata = await useKit((k) => IdentityMetadataWrapper.fetchFromURL(k, metadataURL))
    const claim = metadata.findClaim(ClaimTypes.ATTESTATION_SERVICE_URL)
    if (!claim) {
      throw Error('Missing ATTESTATION_SERVICE_URL claim')
    }
    return claim.url
  } catch (error) {
    throw Error(`Could not verify metadata at ${metadataURL}: ${error}`)
  }
}

export async function initializeKit(force: boolean = false) {
  if (kit === undefined || force) {
    kit = newKit(fetchEnv('CELO_PROVIDER'))
    // Copied from @celo/cli/src/utils/helpers
    try {
      await kit.web3.eth.getBlock('latest')
      rootLogger.info(`Connected to Celo node at ${fetchEnv('CELO_PROVIDER')}`)
    } catch (error) {
      kit = undefined
      throw new Error(
        'Initializing ContractKit failed. Is the Celo node running and accessible via ' +
          `the "CELO_PROVIDER" env var? Currently set as ${fetchEnv('CELO_PROVIDER')}`
      )
    }
  }
}

export async function startPeriodicHealthCheck() {
  await tryHealthCheck()
  setInterval(tryHealthCheck, 60 * 1000)
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
            [Op.lte]: moment()
              .subtract(dbRecordExpiryMins!, 'minutes')
              .toDate(),
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
