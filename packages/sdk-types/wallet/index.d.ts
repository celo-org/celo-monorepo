import { Address } from '../commons'

export interface Wallet {
  getAccounts: () => Address[]
  hasAccount: (address?: Address) => boolean
  signTransaction: (txParams: CeloTx) => Promise<EncodedTransaction>
  signTypedData: (address: Address, typedData: EIP712TypedData) => Promise<string>
  signPersonalMessage: (address: Address, data: string) => Promise<string>
}
