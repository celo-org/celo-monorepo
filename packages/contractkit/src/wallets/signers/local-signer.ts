// @ts-ignore-next-line
import { account as Account } from 'eth-lib'
import { trimLeading0x } from '@celo/utils/lib/address'
import * as ethUtil from 'ethereumjs-util'
import { EIP712TypedData, generateTypedDataHash } from '../../utils/sign-typed-data-utils'
import { getHashFromEncoded, RLPEncodedTx } from '../../utils/signing-utils'
import { Signer } from './signer'

/**
 * Signs the EVM transaction using the provided private key
 */
export class LocalSigner implements Signer {
  private privateKey: string

  constructor(privateKey: string) {
    this.privateKey = privateKey
  }

  getNativeKey(): string {
    return this.privateKey
  }

  async signTransaction(
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: string; r: string; s: string }> {
    const hash = getHashFromEncoded(encodedTx.rlpEncode)
    const signature = Account.makeSigner(addToV)(hash, this.privateKey)
    const [v, r, s] = Account.decodeSignature(signature)
    return { v, r, s }
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    // ecsign needs a privateKey without 0x
    const trimmedKey = trimLeading0x(this.privateKey)
    const pkBuffer = Buffer.from(trimmedKey, 'hex')

    const dataBuff = ethUtil.toBuffer(data)
    const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff)

    const sig = ethUtil.ecsign(msgHashBuff, pkBuffer)
    return {
      v: parseInt(sig.v),
      r: Buffer.from(sig.r),
      s: Buffer.from(sig.s),
    }
  }

  async signTypedData(typedData: EIP712TypedData): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const dataBuff = generateTypedDataHash(typedData)
    // ecsign needs a privateKey without 0x
    const trimmedKey = trimLeading0x(this.privateKey)
    const pkBuffer = Buffer.from(trimmedKey, 'hex')
    const sig = ethUtil.ecsign(dataBuff, pkBuffer)
    return {
      v: parseInt(sig.v),
      r: Buffer.from(sig.r),
      s: Buffer.from(sig.s),
    }
  }
}
