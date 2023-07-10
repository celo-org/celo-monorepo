import { AccountAndBalance, ConsensusType, Validator } from '../generate_utils'

export interface GenesisConfig {
  validators?: Validator[]
  consensusType?: ConsensusType
  initialAccounts?: AccountAndBalance[]
  blockTime?: number
  epoch?: number
  lookbackwindow?: number
  chainId?: number
  requestTimeout?: number
  enablePetersburg?: boolean
  timestamp?: number
  // Activation block numbers for Celo hard forks, null for never activating
  churritoBlock?: number | null
  donutBlock?: number | null
  espressoBlock?: number | null
  gingerbreadBlock?: number | null
}
