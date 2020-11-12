import { ContractKit } from '@celo/contractkit'
import Logger from 'bunyan'

export interface Context {
  kit: ContractKit
  mnemonic: string
  logger: Logger
}
