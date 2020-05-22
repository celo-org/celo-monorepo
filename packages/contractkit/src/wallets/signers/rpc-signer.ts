import { InterceptedMethods } from '../../providers/celo-provider'
import { RpcCaller } from '../../utils/rpc-caller'
import { decodeSig, RLPEncodedTx } from '../../utils/signing-utils'
import { Signer } from './signer'

const currentTimeInSeconds = () => Math.round(Date.now() / 1000)

/**
 * Implements the signer interface on top of the JSON-RPC interface.
 */
export class RpcSigner implements Signer {
  /**
   * Construct a new instance of the RPC signer
   *
   * @param rpc RPC caller instance
   * @param account Account address derived from the private key to be called in init
   * @param unlockBufferSeconds Number of seconds to shrink the unlocked duration by to account for
   * latency and timing inconsistencies on the node
   * @param unlockTime Timestamp in seconds when the signer was last unlocked
   * @param unlockDuration Number of seconds that the signer was last unlocked for
   *
   */
  constructor(
    protected rpc: RpcCaller,
    protected account: string,
    protected unlockBufferSeconds = 5,
    protected unlockTime = -1,
    protected unlockDuration = -1
  ) {}

  init = (privateKey: string, passphrase: string) =>
    this.rpc.call('personal_importRawKey', [privateKey, passphrase])

  /**
   * @dev addToV is unused because the geth JSON-RPC adds this.
   */
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
