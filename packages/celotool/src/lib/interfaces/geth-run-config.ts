import { GenesisConfig } from './genesis-config'
import { GethInstanceConfig } from './geth-instance-config'

export interface GethRunConfig {
  // migration
  migrate?: boolean
  migrateTo?: number
  migrationOverrides?: any
  keepData?: boolean
  // ??
  useBootnode?: boolean
  // genesis config
  genesisConfig?: GenesisConfig
  // network
  network: string
  networkId: number
  // where to run
  runPath: string
  verbosity?: number
  gethRepoPath?: string
  // running instances
  instances: GethInstanceConfig[]
}
