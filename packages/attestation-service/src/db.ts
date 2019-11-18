import { ContractKit, newKit } from '@celo/contractkit'
import { FindOptions, Sequelize } from 'sequelize'
import { fetchEnv } from './env'
import Attestation, { AttestationModel, AttestationStatic } from './models/attestation'

export let sequelize: Sequelize | undefined

export function initializeDB() {
  if (sequelize === undefined) {
    sequelize = new Sequelize(fetchEnv('DATABASE_URL'))
    return sequelize.authenticate() as Promise<void>
  }
  return Promise.resolve()
}

export let kit: ContractKit

export async function initializeKit() {
  if (kit === undefined) {
    kit = newKit(fetchEnv('CELO_PROVIDER'))
    const blockNumber = await kit.web3.eth.getBlockNumber()
    if (blockNumber === 0) {
      throw new Error(
        'Could not fetch latest block from web3 provider ' + fetchEnv('CELO_PROVIDER')
      )
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
  phoneNumber: string,
  account: string,
  issuer: string,
  options: FindOptions = {}
): Promise<AttestationModel | null> {
  return (await getAttestationTable()).findOne({
    where: { phoneNumber, account, issuer },
    ...options,
  })
}
