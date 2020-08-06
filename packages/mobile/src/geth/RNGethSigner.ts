import { normalizeAddressWith0x } from '@celo/utils/src/address'
import { Tx } from 'web3-core'
import { Signer } from '@celo/contractkit/lib/wallets/signers/signer'
import {
  encodeTransaction,
  extractSignature,
  rlpEncodedTx,
} from '@celo/contractkit/lib/utils/signing-utils'
import RNGeth from 'react-native-geth'

const INCORRECT_PASSWORD_ERROR = 'could not decrypt key with given password'
const currentTimeInSeconds = () => Math.round(Date.now() / 1000)

/**
 * Implements the signer interface on top of a RNGeth instance
 */
export class RNGethSigner implements Signer {
  /**
   * Construct a new instance of the RPC signer
   *
   * @param geth the RNGeth instance
   * @param account Account address derived from the private key to be called in init
   * @param unlockBufferSeconds Number of seconds to shrink the unlocked duration by to account for
   * latency and timing inconsistencies on the node
   * @param unlockTime Timestamp in seconds when the signer was last unlocked
   * @param unlockDuration Number of seconds that the signer was last unlocked for
   * TODO: Fix geth: any by adding typings
   */
  constructor(
    protected geth: RNGeth,
    protected account: string,
    protected unlockBufferSeconds = 5,
    protected unlockTime = -1,
    protected unlockDuration = -1
  ) {}

  async init(privateKey: string, passphrase: string) {
    return await this.geth.addAccount(privateKey, passphrase)
  }

  async signRawTransaction(tx: Tx) {
    if (normalizeAddressWith0x(tx.from! as string) !== this.account) {
      throw new Error(`RNGethSigner(${this.account}) cannot sign tx with 'from' ${tx.from}`)
    }
    const encoded = rlpEncodedTx(tx)
    const signedTxRLP = await this.geth.signTransaction(encoded.rlpEncode, this.account)
    console.log(signedTxRLP)
    return await encodeTransaction(encoded, extractSignature(signedTxRLP))
  }

  async signTransaction(): Promise<{ v: number; r: Buffer; s: Buffer }> {
    throw new Error('signTransaction unimplemented; use signRawTransaction')
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    throw new Error('signPersonalTransaction notimplemented;')
  }

  getNativeKey = () => this.account

  async unlock(passphrase: string, duration: number): Promise<boolean> {
    try {
      await this.geth.unlockAccount(this.account, passphrase, duration)
    } catch (error) {
      if (error?.message?.toLowerCase()?.includes(INCORRECT_PASSWORD_ERROR)) {
        return false
      }

      // Re-throw otherwise
      throw error
    }

    this.unlockTime = currentTimeInSeconds()
    this.unlockDuration = duration
    return true
  }

  isUnlocked() {
    return this.unlockTime + this.unlockDuration - this.unlockBufferSeconds > currentTimeInSeconds()
  }

  decrypt(_ciphertext: Buffer) {
    return Promise.reject(new Error('Decryption operation is not supported on this signer'))
  }
}
