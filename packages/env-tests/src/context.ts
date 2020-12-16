import { ContractKit } from '@celo/contractkit'
import Logger from 'bunyan'

export interface EnvTestContext {
  kit: ContractKit
  mnemonic: string
  logger: Logger
}
