import { ensureLeading0x, normalizeAddressWith0x, trimLeading0x } from '@celo/utils/src/address'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { EncodedTransaction, Tx } from 'web3-core'
import { RpcCaller } from '../../utils/rpc-caller'
import { decodeSig } from '../../utils/signing-utils'
import { Signer } from './signer'

const INCORRECT_PASSWORD_ERROR = 'could not decrypt key with given password'

const currentTimeInSeconds = () => Math.round(Date.now() / 1000)

const toRpcHex = (val: string | number | BigNumber | BN | undefined) => {
  if (typeof val === 'number' || val instanceof BigNumber) {
    return ensureLeading0x(val.toString(16))
  } else if (typeof val === 'string') {
    return ensureLeading0x(val)
  } else {
    return '0x0'
  }
}

// TODO(yorke): move this into rpc-caller and generate typings from RPC spec
enum RpcSignerEndpoint {
  ImportAccount = 'personal_importRawKey',
  UnlockAccount = 'personal_unlockAccount',
  SignTransaction = 'eth_signTransaction',
  SignBytes = 'eth_sign',
  Decrypt = 'personal_decrypt',
}

// tslint:disable-next-line: interface-over-type-literal
type RpcSignerEndpointInputs = {
  personal_importRawKey: [string, string]
  personal_unlockAccount: [string, string, number]
  eth_signTransaction: [any] // RpcTx doesn't match Tx because of nonce as string instead of number
  eth_sign: [string, string]
  personal_decrypt: [string, string]
}

// tslint:disable-next-line: interface-over-type-literal
type RpcSignerEndpointResult = {
  personal_importRawKey: string
  personal_unlockAccount: boolean
  eth_signTransaction: EncodedTransaction
  eth_sign: string
  personal_decrypt: string
}

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
    this.callAndCheckResponse(RpcSignerEndpoint.ImportAccount, [
      trimLeading0x(privateKey),
      passphrase,
    ])

  async signRawTransaction(tx: Tx) {
    if (normalizeAddressWith0x(tx.from! as string) !== this.account) {
      throw new Error(`RpcSigner cannot sign tx with 'from' ${tx.from}`)
    }
    // see geth SendTxArgs type
    // https://github.com/celo-org/celo-blockchain/blob/bf2ba25426f9956384220b8b2ce302337e7fa8a4/internal/ethapi/api.go#L1363
    const rpcTx = {
      ...tx,
      nonce: toRpcHex(tx.nonce),
      value: toRpcHex(tx.value),
      gas: toRpcHex(tx.gas),
      gasPrice: toRpcHex(tx.gasPrice),
      gatewayFee: toRpcHex(tx.gatewayFee),
    }
    return this.callAndCheckResponse(RpcSignerEndpoint.SignTransaction, [rpcTx])
  }

  async signTransaction(): Promise<{ v: number; r: Buffer; s: Buffer }> {
    throw new Error('signTransaction unimplemented; use signRawTransaction')
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const result = await this.callAndCheckResponse(RpcSignerEndpoint.SignBytes, [
      this.account,
      data,
    ])
    return decodeSig(result)
  }

  getNativeKey = () => this.account

  async unlock(passphrase: string, duration: number): Promise<boolean> {
    try {
      await this.callAndCheckResponse(RpcSignerEndpoint.UnlockAccount, [
        this.account,
        passphrase,
        duration,
      ])
    } catch (error) {
      // The callAndCheckResponse will throw an error if the passphrase is incorrect
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

  private async callAndCheckResponse<T extends RpcSignerEndpoint>(
    endpoint: T,
    params: RpcSignerEndpointInputs[T]
  ): Promise<RpcSignerEndpointResult[T]> {
    const response = await this.rpc.call(endpoint, params)
    if (response.error) {
      throw new Error(`RpcSigner@${endpoint} failed with \n'${(response.error as any).message}'`)
    }
    return response.result! as RpcSignerEndpointResult[typeof endpoint]
  }

  async decrypt(ciphertext: Buffer) {
    const resp = await this.callAndCheckResponse(RpcSignerEndpoint.Decrypt, [
      this.account,
      ensureLeading0x(ciphertext.toString('hex')),
    ])

    return Buffer.from(trimLeading0x(resp), 'hex')
  }
}
