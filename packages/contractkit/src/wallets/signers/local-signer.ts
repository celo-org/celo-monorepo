import { ensureLeading0x, trimLeading0x } from '@celo/base/lib/address'
import { Decrypt } from '@celo/utils/lib/ecies'
// @ts-ignore-next-line
import { account as Account } from 'eth-lib'
import * as ethUtil from 'ethereumjs-util'
import { decodeSig, getHashFromEncoded, RLPEncodedTx } from '../../utils/signing-utils'
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
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const hash = getHashFromEncoded(encodedTx.rlpEncode)
    const signature = Account.makeSigner(addToV)(hash, this.privateKey)
    return decodeSig(signature)
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    // ecsign needs a privateKey without 0x
    const trimmedKey = trimLeading0x(this.privateKey)
    const pkBuffer = Buffer.from(trimmedKey, 'hex')

    const dataBuff = ethUtil.toBuffer(ensureLeading0x(data))
    const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff)

    const sig = ethUtil.ecsign(msgHashBuff, pkBuffer)
    return {
      v: parseInt(sig.v, 10),
      r: Buffer.from(sig.r),
      s: Buffer.from(sig.s),
    }
  }

  decrypt(ciphertext: Buffer) {
    const decryptedPlaintext = Decrypt(
      Buffer.from(trimLeading0x(this.privateKey), 'hex'),
      ciphertext
    )
    return Promise.resolve(decryptedPlaintext)
  }
}
