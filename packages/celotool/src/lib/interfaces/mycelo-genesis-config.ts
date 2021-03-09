import { GenesisConfig } from 'src/lib/interfaces/genesis-config'

export interface MyceloGenesisConfig {
  genesisConfig: GenesisConfig
  numValidators: number // used in place of genesisConfig.validators
  mnemonic: string
  gethRepoPath: string
  migrationOverrides?: any
}
