import { ensureLeading0x, normalizeAddressWith0x } from '@celo/base/lib/address'
import { CeloTx, RLPEncodedTx, Signer } from '@celo/connect'
import { ensureUncompressed } from '@celo/utils/lib/ecdh'
import { EIP712TypedData, generateTypedDataHash } from '@celo/utils/lib/sign-typed-data-utils'
import { encodeTransaction, extractSignature, rlpEncodedTx } from '@celo/wallet-base'
import * as ethUtil from 'ethereumjs-util'
import { GethNativeModule } from 'react-native-geth'
import Logger from 'src/utils/Logger'

const INCORRECT_PASSWORD_ERROR = 'could not decrypt key with given password'
const currentTimeInSeconds = () => Math.floor(Date.now() / 1000)

const TAG = 'geth/GethNativeBridgeSigner'
/**
 * Implements the signer interface on top of a RNGeth instance
 */
export class GethNativeBridgeSigner implements Signer {
  /**
   * Construct a new instance of the RPC signer
   *
   * @param geth the RNGeth instance
   * @param account Account address derived from the private key to be called in init
   * @param unlockBufferSeconds Number of seconds to shrink the unlocked duration by to account for
   * latency and timing inconsistencies on the node
   * @param unlockTime Timestamp in seconds when the signer was last unlocked
   * @param unlockDuration Number of seconds that the signer was last unlocked for
   */
  constructor(
    protected geth: GethNativeModule,
    protected account: string,
    protected unlockBufferSeconds = 5,
    protected unlockTime?: number,
    protected unlockDuration?: number
  ) {}

  async init(privateKey: string, passphrase: string) {
    return this.geth.addAccount(this.hexToBase64(privateKey), passphrase)
  }

  async signRawTransaction(tx: CeloTx) {
    if (normalizeAddressWith0x(tx.from! as string) !== this.account) {
      throw new Error(`RNGethSigner(${this.account}) cannot sign tx with 'from' ${tx.from}`)
    }
    const encodedTx = rlpEncodedTx(tx)
    const signature = await this.signTransaction(0, encodedTx)
    return encodeTransaction(encodedTx, signature)
  }

  async signTransaction(
    // addToV (chainId) is ignored here because geth will
    // build it based on its configuration
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const signedTxBase64 = await this.geth.signTransaction(
      this.hexToBase64(encodedTx.rlpEncode),
      this.account
    )
    return extractSignature(this.base64ToHex(signedTxBase64))
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    Logger.info(`${TAG}@signPersonalMessage`, `Signing ${data}`)
    const hash = ethUtil.hashPersonalMessage(Buffer.from(data.replace('0x', ''), 'hex'))
    const signatureBase64 = await this.geth.signHash(hash.toString('base64'), this.account)
    return ethUtil.fromRpcSig(this.base64ToHex(signatureBase64))
  }

  async signTypedData(typedData: EIP712TypedData): Promise<{ v: number; r: Buffer; s: Buffer }> {
    // TODO: Not sure if it makes more sense to expose a `signTypedData` function on the RN Bridge
    // or just construct the hash here.
    Logger.info(`${TAG}@signTypedData`, `Signing typed data`)
    const hash = generateTypedDataHash(typedData)
    const signatureBase64 = await this.geth.signHash(hash.toString('base64'), this.account)
    return ethUtil.fromRpcSig(this.base64ToHex(signatureBase64))
  }

  getNativeKey = () => this.account

  async unlock(passphrase: string, duration: number): Promise<boolean> {
    try {
      // Duration in geth should be nanoseconds
      const durationNano = duration * 1000000000
      await this.geth.unlockAccount(this.account, passphrase, durationNano)
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

  isUnlocked(): boolean {
    if (this.unlockDuration === undefined || this.unlockTime === undefined) {
      return false
    }
    return this.unlockTime + this.unlockDuration - this.unlockBufferSeconds > currentTimeInSeconds()
  }

  async decrypt(ciphertext: Buffer): Promise<Buffer> {
    const textBase64 = await this.geth.decrypt(this.account, ciphertext.toString('base64'))
    return Buffer.from(textBase64, 'base64')
  }

  async computeSharedSecret(publicKey: string): Promise<Buffer> {
    const uncompressedPublicKey = ensureUncompressed(publicKey)
    const secretBase64 = await this.geth.computeSharedSecret(
      this.account,
      this.hexToBase64(uncompressedPublicKey)
    )
    return Buffer.from(secretBase64, 'base64')
  }

  hexToBase64(hex: string) {
    return Buffer.from(hex.replace('0x', ''), 'hex').toString('base64')
  }

  base64ToHex(base64: string) {
    return ensureLeading0x(Buffer.from(base64, 'base64').toString('hex'))
  }
}
