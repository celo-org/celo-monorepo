// @ts-ignore-next-line
import { account as Account } from 'eth-lib'
import * as ethUtil from 'ethereumjs-util'
import { RpcCaller } from '../../utils/rpc-caller'
import { RLPEncodedTx } from '../../utils/signing-utils'
import { Signer } from './signer'

export class GethSigner implements Signer {
  constructor(protected gethRpcCaller: RpcCaller) {}

  async signTransaction(
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const signature = await this.gethRpcCaller.call('eth_signTransaction', [encodedTx.transaction])
    const [v, r, s] = Account.decodeSignature(signature)
    return {
      v: parseInt(v, 16) + addToV, // TODO(yorke): check if this is necessary
      r: ethUtil.toBuffer(r) as Buffer,
      s: ethUtil.toBuffer(s) as Buffer,
    }
  }

  async signPersonalMessage(_: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    throw new Error('GethSigner: signPersonalMessage unimplemented')
  }

  getNativeKey(): string {
    throw new Error('GethSigner: getNativeKey unimplemented')
  }
}
