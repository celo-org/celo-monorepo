import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'
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
  ) => Promise<{ v: number; r: Buffer; s: Buffer }>
  signPersonalMessage: (data: string) => Promise<{ v: number; r: Buffer; s: Buffer }>
  signTypedData: (typedData: EIP712TypedData) => Promise<{ v: number; r: Buffer; s: Buffer }>
  getNativeKey: () => string
  decrypt: (ciphertext: Buffer) => Promise<Buffer>
  computeSharedSecret: (publicKey: string) => Promise<Buffer>
}
