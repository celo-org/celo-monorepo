import { ContractKit, newKit } from '@celo/contractkit'
import { FindOptions, Sequelize } from 'sequelize'
import { Block } from 'web3-eth'
import { fetchEnv } from './env'
import { rootLogger } from './logger'
import Attestation, { AttestationModel, AttestationStatic } from './models/attestation'

export let sequelize: Sequelize | undefined

export function initializeDB() {
  if (sequelize === undefined) {
    sequelize = new Sequelize(fetchEnv('DATABASE_URL'), {
      logging: (msg: string, sequelizeLogArgs: any) =>
        rootLogger.debug({ sequelizeLogArgs, component: 'sequelize' }, msg),
    })
    return sequelize.authenticate() as Promise<void>
  }
  return Promise.resolve()
}

export let kit: ContractKit

export async function initializeKit() {
  if (kit === undefined) {
    kit = newKit(fetchEnv('CELO_PROVIDER'))
    // Copied from @celo/cli/src/utils/helpers
    try {
      const syncProgress = await kit.web3.eth.isSyncing()
      if (typeof syncProgress === 'boolean' && !syncProgress) {
        const latestBlock: Block = await kit.web3.eth.getBlock('latest')
        if (latestBlock && latestBlock.number > 0) {
          // To catch the case in which syncing has happened in the past,
          // has stopped, and hasn't started again, check for an old timestamp
          // on the latest block
          const ageOfBlock = Date.now() / 1000 - Number(latestBlock.timestamp)
          if (ageOfBlock > 120) {
            throw new Error(
              `Latest block is ${ageOfBlock} seconds old, and syncing is not currently in progress`
            )
          }
        }
      } else {
        throw new Error('Node is not synced')
      }
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
