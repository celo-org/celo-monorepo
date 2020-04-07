import { EIP712TypedData } from '../../utils/sign-typed-data-utils'
import { RLPEncodedTx } from '../../utils/signing-utils'

export interface Signer {
  /**
   * Signs the message and returns an EVM transaction
   * @param addToV represents the chainId and is added to the recoveryId to prevent replay
   * @param encodedTx is the RLPEncoded transaction object
   */
  signTransaction: (
    addToV: number,
    encodedTx: RLPEncodedTx
  ) => Promise<{ v: string; r: string; s: string }>
  signPersonalMessage: (
    data: string
  ) => Promise<{ v: number; r: Buffer | Uint8Array; s: Buffer | Uint8Array }>
  signTypedData: (
    typedData: EIP712TypedData
  ) => Promise<{ v: number; r: Buffer | Uint8Array; s: Buffer | Uint8Array }>
  getNativeKey: () => string
}
