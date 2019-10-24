import { ContractKit, newKit } from '@celo/contractkit'
import { Sequelize } from 'sequelize'
import Attestation, { AttestationStatic } from '../models/attestation'
import { fetchEnv } from './env'

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

export async function existingAttestationRequest(
  phoneNumber: string,
  account: string,
  issuer: string
): Promise<AttestationStatic | null> {
  const AttestationTable = await Attestation(sequelize!)
  return AttestationTable.findOne({ where: { phoneNumber, account, issuer } })
}

export async function persistAttestationRequest(
  phoneNumber: string,
  account: string,
  issuer: string
) {
  const AttestationTable = await Attestation(sequelize!)
  return AttestationTable.create({ phoneNumber, account, issuer })
}
