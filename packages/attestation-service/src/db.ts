import { ContractKit, newKit } from '@celo/contractkit'
import { Sequelize } from 'sequelize'
import { fetchEnv } from './env'
import Attestation, { AttestationStatic } from './models/attestation'

export let sequelize: Sequelize | undefined

export function initializeDB() {
  if (sequelize === undefined) {
    sequelize = new Sequelize(fetchEnv('DATABASE_URL'))
    return sequelize.authenticate() as Promise<void>
  }
  return Promise.resolve()
}

export let kit: ContractKit

export function initializeKit() {
  if (kit === undefined) {
    kit = newKit(fetchEnv('CELO_PROVIDER'))
  }
}

let AttestationTable: AttestationStatic

async function getAttestationTable() {
  if (AttestationTable) {
    return AttestationTable
  }
  return Attestation(sequelize!)
}

export async function existingAttestationRequest(
  phoneNumber: string,
  account: string,
  issuer: string
): Promise<AttestationStatic | null> {
  return (await getAttestationTable()).findOne({ where: { phoneNumber, account, issuer } })
}

export async function persistAttestationRequest(
  phoneNumber: string,
  account: string,
  issuer: string
) {
  return (await getAttestationTable()).create({ phoneNumber, account, issuer })
}
