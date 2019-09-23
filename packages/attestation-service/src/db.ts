import { ContractKit, newKit } from '@celo/contractkit'
import { Sequelize } from 'sequelize'
import { fetchEnv } from './env'

export let sequelize: Sequelize | undefined

export function initializeDB() {
  if (sequelize === undefined) {
    sequelize = new Sequelize(fetchEnv('DB_URL'))
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
