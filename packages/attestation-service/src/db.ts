import { ContractKit, newKit } from '@celo/contractkit'
import { FindOptions, Sequelize } from 'sequelize'
import { fetchEnv, getAttestationSignerAddress } from './env'
import { rootLogger } from './logger'
import Attestation, { AttestationModel, AttestationStatic } from './models/attestation'

export let sequelize: Sequelize | undefined

export function initializeDB() {
  if (sequelize === undefined) {
    sequelize = new Sequelize(fetchEnv('DATABASE_URL'), {
      logging: (msg: string, sequelizeLogArgs: any) =>
        rootLogger.debug({ sequelizeLogArgs, component: 'sequelize' }, msg),
    })
    rootLogger.info('Initializing Database')
    return sequelize.authenticate() as Promise<void>
  }
  return Promise.resolve()
}

export function isDBOnline() {
  if (sequelize === undefined) {
    return initializeDB()
  } else {
    return sequelize.authenticate() as Promise<void>
  }
}

export let kit: ContractKit

export async function isNodeSyncing() {
  const syncProgress = await kit.web3.eth.isSyncing()
  return typeof syncProgress === 'boolean' && syncProgress
}

export async function getAgeOfLatestBlock() {
  const latestBlock = await kit.web3.eth.getBlock('latest')
  const ageOfLatestBlock = Date.now() / 1000 - Number(latestBlock.timestamp)
  return {
    ageOfLatestBlock,
    number: latestBlock.number,
  }
}

export async function isAttestationSignerUnlocked() {
  // The only way to see if a key is unlocked is to try to sign something
  try {
    await kit.web3.eth.sign('DO_NOT_USE', getAttestationSignerAddress())
    return true
  } catch {
    return false
  }
}

export async function initializeKit() {
  if (kit === undefined) {
    kit = newKit(fetchEnv('CELO_PROVIDER'))
    // Copied from @celo/cli/src/utils/helpers
    try {
      const { ageOfLatestBlock } = await getAgeOfLatestBlock()
      rootLogger.info({ ageOfLatestBlock }, 'Initializing ContractKit')
    } catch (error) {
      rootLogger.error(
        'Initializing Kit failed, are you running your node and specified it with the "CELO_PROVIDER" env var?. It\' currently set as ' +
          fetchEnv('CELO_PROVIDER')
      )
      throw error
    }
  }
}

let AttestationTable: AttestationStatic

export async function getAttestationTable() {
  if (AttestationTable) {
    return AttestationTable
  }
  AttestationTable = await Attestation(sequelize!)
  return AttestationTable
}

export async function existingAttestationRequestRecord(
  identifier: string,
  account: string,
  issuer: string,
  options: FindOptions = {}
): Promise<AttestationModel | null> {
  return (await getAttestationTable()).findOne({
    where: { identifier, account, issuer },
    ...options,
  })
}
