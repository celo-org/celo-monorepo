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
const celoProviders = getCeloProviders()
const smartFallback = !isYes(fetchEnvOrDefault('DISABLE_SMART_FALLBACK', 'false'))

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

// let kit: ContractKit | undefined
// let backupKit: ContractKit | undefined
const kits = new Array<ContractKit | undefined>(celoProviders.length).fill(undefined)

async function execWithFallback<T>(
  f: (kit: ContractKit) => T,
  kit1: ContractKit,
  kit2?: ContractKit | undefined,
  smartFallback = true
): Promise<T> {
  // Decorator to wrap execution of f
  // with an optional prioritization of kit1 and kit2
  // an retry logic if execution with the first kit fails

  console.log('in execWithFallback')
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
      return await f(secondaryKit!)
    } else {
      throw error
    }
  }
}

// async function execWithFallbackKits<T>(
//   f: (kit: ContractKit) => T,
//   kits: ContractKit[],
//   smartFallback = true
// ): Promise<T> {
//   // Decorator to wrap execution of f with a prioritization of
//   // if execution initially fails
//   console.log('in execWithFallback')

//   if (!kits.length) {
//     throw new Error("No initialized kits passed into execWithFallback")
//   }
//   // Take the first (and if applicable, second) kit
//   let [primaryKit, secondaryKit] = kits

//   if (smartFallback && secondaryKit &&
//     // Prioritize block age over syncing/not; avoids complex checks for stalls
//     // and assumes that if one is stalled, the next block number check will correct this.
//     ((await getAgeOfLatestBlockFromKit(secondaryKit)).number >
//         (await getAgeOfLatestBlockFromKit(primaryKit)).number)
//   ) {
//     rootLogger.info('Prioritizing CELO_PROVIDER_BACKUP')
//     primaryKit = secondaryKit
//     secondaryKit = kits[0]
//   }
//   try {
//     return await f(primaryKit)
//   } catch (error) {
//     rootLogger.warn(`Using ContractKit failed: ${error}`)
//     if (secondaryKit) {
//       rootLogger.info(`Attempting to use secondary ContractKit`)
//       return await f(secondaryKit!)
//     } else {
//       throw error
//     }
//   }
// }

// Wrapper that on error tries once to reinitialize connection to node.
// export async function useKitOld<T>(f: (kit: ContractKit) => T): Promise<T> {
//   // const smartFallback = !isYes(fetchEnvOrDefault('DISABLE_SMART_FALLBACK', 'false'))
//   console.log('in useKitOld')
//   if (!kit && !backupKit) {
//     await initializeKit(true)
//     // tslint:disable-next-line: no-return-await
//     console.log('in useKitOld if block')
//     return await execWithFallback(f, kit!, backupKit, smartFallback)
//   } else {
//     try {
//       console.log('in useKitOld try block')
//       return await execWithFallback(f, kit!, backupKit, smartFallback)
//     } catch (error) {
//       await initializeKit(true)
//       console.log('in useKitOld except block')
//       // tslint:disable-next-line: no-return-await
//       return await execWithFallback(f, kit!, backupKit, smartFallback)
//     }
//   }
// }

export async function useKit<T>(f: (kit: ContractKit) => T): Promise<T> {
  // const smartFallback = !isYes(fetchEnvOrDefault('DISABLE_SMART_FALLBACK', 'false'))
  console.log('in useKit')
  let usableKits = kits.filter((k) => k !== undefined)
  console.log('usableKits length: ', usableKits.length)

  const reinitAndRetry = async () => {
    console.log('in reinitAndRetry')
    await initializeKit(true)
    usableKits = kits.filter((k) => k !== undefined)
    console.log('usableKits length: ', usableKits.length)
    // tslint:disable-next-line: no-return-await
    return await execWithFallback(f, usableKits[0]!, usableKits[1], smartFallback)
  }

  if (!usableKits.length) {
    // This throws an error if no kits are initialized
    console.log('in useKit if block')
    // await initializeKit(true)
    // usableKits = kits.filter(k => k !== undefined)
    // // tslint:disable-next-line: no-return-await
    // return await execWithFallback(f, usableKits[0]!, usableKits[1], smartFallback)
    return await reinitAndRetry()
  } else {
    try {
      console.log('in useKit try block')
      return await execWithFallback(f, usableKits[0]!, usableKits[1], smartFallback)
    } catch (error) {
      console.log('in useKit except block')
      // await initializeKit(true)
      // usableKits = kits.filter(k => k !== undefined)
      // // tslint:disable-next-line: no-return-await
      // return await execWithFallback(f, usableKits[0]!, usableKits[1], smartFallback)
      return await reinitAndRetry()
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
  // TODO implement timeout -- if it times out/throws an error, could return block number of 0 and age of inf?
  // alt. need to figure out how to handle that in a reasonable way/throw
  console.log('starting to get block')
  // const startTime = Date.now()

  // const latestBlock = await k!.connection.getBlock('latest')
  try {
    return await withTimeout(500, async () => {
      let latestBlock: Block
      try {
        // Differentiate between errors with getBlock and timeouts
        latestBlock = await k!.connection.getBlock('latest')
      } catch (error) {
        throw new Error(`Error fetching latest block: ${error.message}`)
      }
      const ageOfLatestBlock = Date.now() / 1000 - Number(latestBlock.timestamp)
      console.log('latest block number: ', latestBlock.number)
      return {
        ageOfLatestBlock,
        number: latestBlock.number,
      }
    })
  } catch (error) {
    rootLogger.warn(error.message)
    // Set this to values that should always be comparitively out-of-date
    return {
      ageOfLatestBlock: maxAgeLatestBlock + 1,
      number: -1,
    }
  }
  // setTimeout(() => findAttestationAndSendSms(key, childLogger, sequelizeLogger), timeout)

  // console.log("time to get block:", Date.now() - startTime)
  // const ageOfLatestBlock = Date.now() / 1000 - Number(latestBlock.timestamp)
  // return {
  //   ageOfLatestBlock,
  //   number: latestBlock.number,
  // }
}

export async function getAgeOfLatestBlock() {
  console.log('in getAgeOfLatestBlock')
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

// export async function initializeKit(force: boolean = false) {
//   console.log('initializing kit')
//   if (kit === undefined || force) {
//     // Prefer passed in keystore if these variables are set
//     const keystoreDirpath = fetchEnvOrDefault('ATTESTATION_SIGNER_KEYSTORE_DIRPATH', '')
//     const keystorePassphrase = fetchEnvOrDefault('ATTESTATION_SIGNER_KEYSTORE_PASSPHRASE', '')
//     const celoProviderBackup = fetchEnvOrDefault('CELO_PROVIDER_BACKUP', '')
//     if (!keystoreDirpath || !keystorePassphrase) {
//       // Backwards compatibility -- assume this is the deployed full node
//       kit = newKitFromWeb3(new Web3(fetchEnv('CELO_PROVIDER')))
//       if (celoProviderBackup && (!backupKit || force)) {
//         backupKit = newKitFromWeb3(new Web3(celoProviderBackup))
//       }
//     } else {
//       const keystoreWalletWrapper = new KeystoreWalletWrapper(new FileKeystore(keystoreDirpath))
//       try {
//         await keystoreWalletWrapper.unlockAccount(
//           fetchEnv('ATTESTATION_SIGNER_ADDRESS'),
//           keystorePassphrase
//         )
//       } catch (error) {
//         kit = undefined
//         throw new Error(
//           `Unlocking keystore file for account ${fetchEnv('ATTESTATION_SIGNER_ADDRESS')} failed: ` +
//             error.message
//         )
//       }
//       kit = newKitFromWeb3(
//         new Web3(fetchEnv('CELO_PROVIDER')),
//         keystoreWalletWrapper.getLocalWallet()
//       )
//       if (celoProviderBackup && (!backupKit || force)) {
//         backupKit = newKitFromWeb3(
//           new Web3(celoProviderBackup),
//           keystoreWalletWrapper.getLocalWallet()
//         )
//       }
//     }

//     // Copied from @celo/cli/src/utils/helpers
//     try {
//       await kit.connection.getBlock('latest')
//       rootLogger.info(`Connected to Celo node at ${fetchEnv('CELO_PROVIDER')}`)
//     } catch (error) {
//       kit = undefined
//       rootLogger.warn(`Failed to connect to Celo node at ${fetchEnv('CELO_PROVIDER')}`)
//       if (backupKit) {
//         try {
//           await backupKit.connection.getBlock('latest')
//           rootLogger.info(`Connected to Celo node at ${fetchEnv('CELO_PROVIDER_BACKUP')}`)
//         } catch (error2) {
//           backupKit = undefined
//           throw new Error(
//             'Initializing ContractKit failed for both providers. Is the Celo node running and accessible via ' +
//               `the "CELO_PROVIDER" env var? Currently set as ${fetchEnv('CELO_PROVIDER')}`
//           )
//         }
//       }
//     }
//   }
// }

// TODO rename
export async function initializeKit(force: boolean = false) {
  console.log('initializing kits')
  // Prefer passed in keystore if these variables are set
  const keystoreDirpath = fetchEnvOrDefault('ATTESTATION_SIGNER_KEYSTORE_DIRPATH', '')
  const keystorePassphrase = fetchEnvOrDefault('ATTESTATION_SIGNER_KEYSTORE_PASSPHRASE', '')

  let keystoreWalletWrapper: KeystoreWalletWrapper | undefined
  if (keystoreDirpath && keystorePassphrase) {
    keystoreWalletWrapper = new KeystoreWalletWrapper(new FileKeystore(keystoreDirpath))
    const signerAddress = fetchEnv('ATTESTATION_SIGNER_ADDRESS')
    try {
      await keystoreWalletWrapper.unlockAccount(signerAddress, keystorePassphrase)
    } catch (error) {
      throw new Error(
        `Unlocking keystore file for account ${signerAddress} failed: ` + error.message
      )
    }
  }

  let failedConnections = 0
  // TODO make sure we do not throw an error if we do not try to actually reinit any kits
  // to match prev behavior

  // TODO rename this to kit once the old kit global has been replaced
  kits.forEach(async (k, i) => {
    console.log('trying to intialize kit ', i)
    if (k == undefined || force) {
      console.log('in if branch of initialize')
      try {
        // TODO test Double check that this is actually reinitializing these kits in place?
        console.log('trying to init')
        kits[i] = keystoreWalletWrapper
          ? newKit(celoProviders[i], keystoreWalletWrapper.getLocalWallet())
          : newKit(celoProviders[i])
        // Copied from @celo/cli/src/utils/helpers
        await kits[i]!.connection.getBlock('latest')
        rootLogger.info(`Connected to Celo node at ${celoProviders[i]}`)
      } catch (error) {
        kits[i] = undefined
        rootLogger.warn(`Failed to connect to Celo node at ${celoProviders[i]}`)
        failedConnections++
      }
    }
  })
  // No kits successfully reinitialized or existing kits that work
  if (failedConnections == kits.length) {
    throw new Error(`Initializing ContractKit failed for all providers: ${celoProviders}.`)
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

// Copied from packages/faucet/src/database-helper.ts
function withTimeout<A>(
  timeout: number,
  fn: () => Promise<A>,
  onTimeout?: () => A | Promise<A>
): Promise<A> {
  return new Promise((resolve, reject) => {
    let timeoutHandler: number | null = setTimeout(() => {
      timeoutHandler = null

      if (onTimeout) {
        resolve(onTimeout())
      } else {
        reject(new Error(`Timeout after ${timeout} ms`))
      }
    }, timeout)

    fn()
      .then((val) => {
        if (timeoutHandler !== null) {
          clearTimeout(timeoutHandler)
          resolve(val)
        }
      })
      .catch((err) => {
        if (timeoutHandler !== null) {
          clearTimeout(timeoutHandler)
          reject(err)
        }
      })
  })
}
