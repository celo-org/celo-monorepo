import { EncodedTransaction, Tx } from 'web3-core'
import { Address } from '../base'
import { EIP712TypedData } from '../utils/sign-typed-data-utils'

export interface Wallet {
  getAccounts: () => Address[]
  hasAccount: (address?: Address) => boolean
  signTransaction: (txParams: Tx) => Promise<EncodedTransaction>
  signTypedData: (address: string, typedData: EIP712TypedData) => Promise<string>
  signPersonalMessage: (address: Address, data: string) => Promise<string>
}
