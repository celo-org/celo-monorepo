import { Address, ContractKit } from '@celo/contractkit'
import Logger from 'bunyan'
export interface EnvTestContext {
  kit: ContractKit
  mnemonic: string
  reserveSpenderMultiSigAddress: Address | undefined
  logger: Logger
}
