import { trimLeading0x } from '@celo/utils/lib/address'
import { EIP712TypedData, generateTypedDataHash } from '../../utils/sign-typed-data-utils'
import { RLPEncodedTx } from '../../utils/signing-utils'
import { Signer } from './signer'
import { TransportStatusError } from '@ledgerhq/errors'
import { transportErrorFriendlyMessage } from '../../utils/ledger-utils'
import * as ethUtil from 'ethereumjs-util'

/**
 * Signs the EVM transaction with a Ledger device
 */
export class LedgerSigner implements Signer {
  private ledger: any
  private derivationPath: string

  constructor(ledger: any, derivationPath: string) {
    this.ledger = ledger
    this.derivationPath = derivationPath
  }

  getNativeKey(): string {
    return this.derivationPath
  }

  async signTransaction(
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: string; r: string; s: string }> {
    try {
      const signature = await this.ledger!.signTransaction(
        this.derivationPath,
        trimLeading0x(encodedTx.rlpEncode) // the ledger requires the rlpEncode without the leading 0x
      )
      // EIP155 support. check/recalc signature v value.
      const rv = parseInt(signature.v, 16)
      // tslint:disable-next-line: no-bitwise
      if (rv !== addToV && (rv & addToV) !== rv) {
        addToV += 1 // add signature v bit.
      }
      signature.v = addToV.toString(16)
      return signature
    } catch (error) {
      if (error instanceof TransportStatusError) {
        transportErrorFriendlyMessage(error)
      }
      throw error
    }
  }

  async signPersonalMessage(
    data: string
  ): Promise<{ v: number; r: Buffer | Uint8Array; s: Buffer | Uint8Array }> {
    try {
      const dataBuff = ethUtil.toBuffer(data)
      const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff)
      const trimmedMsgHash = trimLeading0x(msgHashBuff.toString('hex'))
      const signature = await this.ledger!.signPersonalMessage(this.derivationPath, trimmedMsgHash)

      return {
        v: signature.v,
        r: ethUtil.toBuffer(signature.r),
        s: ethUtil.toBuffer(signature.s),
      }
    } catch (error) {
      if (error instanceof TransportStatusError) {
        transportErrorFriendlyMessage(error)
      }
      throw error
    }
  }

  async signTypedData(typedData: EIP712TypedData): Promise<{ v: number; r: Buffer; s: Buffer }> {
    try {
      const dataBuff = generateTypedDataHash(typedData)
      const trimmedData = trimLeading0x(dataBuff.toString('hex'))
      const sig = await this.ledger!.signPersonalMessage(this.derivationPath, trimmedData)

      return {
        v: parseInt(sig.v),
        r: Buffer.from(sig.r),
        s: Buffer.from(sig.s),
      }
    } catch (error) {
      if (error instanceof TransportStatusError) {
        transportErrorFriendlyMessage(error)
      }
      throw error
    }
  }
}
