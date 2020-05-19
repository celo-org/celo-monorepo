// @ts-ignore-next-line
import { account as Account } from 'eth-lib'
import * as ethUtil from 'ethereumjs-util'
import { InterceptedMethods } from '../../providers/celo-provider'
import { RpcCaller } from '../../utils/rpc-caller'
import { RLPEncodedTx } from '../../utils/signing-utils'
import { Signer } from './signer'

const decodeSig = (sig: any) => {
  const [v, r, s] = Account.decodeSignature(sig)
  return {
    v: parseInt(v, 16),
    r: ethUtil.toBuffer(r) as Buffer,
    s: ethUtil.toBuffer(s) as Buffer,
  }
}

const currentTimeInSeconds = () => Math.round(Date.now() / 1000)

export class RpcSigner implements Signer {
  constructor(
    protected rpc: RpcCaller,
    protected account: string,
    protected unlockBufferSeconds = 5,
    protected unlockTime = -1,
    protected unlockDuration = -1
  ) {}

  init = (privateKey: string, passphrase: string) =>
    this.rpc.call('personal_importRawKey', [privateKey, passphrase])

  async signTransaction(
    _: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const tx = encodedTx.transaction
    if (tx.from! !== this.account) {
      throw new Error(`RpcSigner cannot sign tx with 'from' ${tx.from}`)
    }
    const response = await this.rpc.call(InterceptedMethods.signTransaction, [tx])
    if (response.error) {
      throw new Error(`RpcSigner signTransaction failed with ${response.error}`)
    } else {
      return decodeSig(response.result!)
    }
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const response = await this.rpc.call(InterceptedMethods.sign, [data])
    if (response.error) {
      throw new Error(`RpcSigner signPersonalMessage failed with ${response.error}`)
    } else {
      return decodeSig(response.result!)
    }
  }

  getNativeKey = () => this.account

  async unlock(passphrase: string, duration: number) {
    const response = await this.rpc.call('personal_unlockAccount', [
      this.account,
      passphrase,
      duration,
    ])
    if (response.error) {
      throw new Error(`RpcSigner unlock failed with ${response.error}`)
    }
    this.unlockTime = currentTimeInSeconds()
    this.unlockDuration = duration
  }

  isUnlocked() {
    return this.unlockTime + this.unlockDuration - this.unlockBufferSeconds > currentTimeInSeconds()
  }
}
