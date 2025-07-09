import { Address, ContractKit } from '@celo/contractkit'
// @ts-expect-error module started failing
import Logger from 'bunyan'
export interface EnvTestContext {
  kit: ContractKit
  mnemonic: string
  reserveSpenderMultiSigAddress: Address | undefined
  logger: Logger
}
