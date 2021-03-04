import { GenesisConfig } from './genesis-config'
import { GethInstanceConfig } from './geth-instance-config'
import { GethRepository } from './geth-repository'

export interface GethRunConfig {
  // migration
  migrate?: boolean
  migrateTo?: number
  migrationOverrides?: any
  keepData?: boolean
  // genesis config
  genesisConfig?: GenesisConfig
  // network
  network: string
  networkId: number
  // where to run
  runPath: string
  verbosity?: number
  repository?: GethRepository
  // running instances
  instances: GethInstanceConfig[]
}
