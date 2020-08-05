import { Address, CeloTx, EncodedTransaction } from '../commons'

export interface Wallet {
  getAccounts: () => Address[]
  hasAccount: (address?: Address) => boolean
  signTransaction: (txParams: CeloTx) => Promise<EncodedTransaction>
  signTypedData: (address: Address, typedData: EIP712TypedData) => Promise<string>
  signPersonalMessage: (address: Address, data: string) => Promise<string>
}

export interface Signer {
  /**
   * Signs the message and returns an EVM transaction
   * @param addToV represents the chainId and is added to the recoveryId to prevent replay
   * @param encodedTx is the RLPEncoded transaction object
   */
  signTransaction: (
    addToV: number,
    encodedTx: RLPEncodedTx
  ) => Promise<{ v: number; r: Buffer; s: Buffer }>
  signPersonalMessage: (data: string) => Promise<{ v: number; r: Buffer; s: Buffer }>
  getNativeKey: () => string
}
