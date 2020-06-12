import { ensureLeading0x, normalizeAddressWith0x, trimLeading0x } from '@celo/utils/src/address'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { Tx } from 'web3-core'
import { JsonRpcResponse } from 'web3-core-helpers'
import { RpcCaller } from '../../utils/rpc-caller'
import { decodeSig } from '../../utils/signing-utils'
import { Signer } from './signer'

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

  async init(privateKey: string, passphrase: string) {
    const response = await this.rpc.call('personal_importRawKey', [
      trimLeading0x(privateKey),
      passphrase,
    ])
    this.checkResponse(response, 'init')
    return response.result!
  }

  async signRawTransaction(tx: Tx): Promise<any> {
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
    const response = await this.rpc.call('eth_signTransaction', [rpcTx])
    this.checkResponse(response, 'signRawTransaction')
    return response.result!
  }

  async signTransaction(): Promise<{ v: number; r: Buffer; s: Buffer }> {
    throw new Error('signTransaction unimplemented; use signRawTransaction')
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const response = await this.rpc.call('eth_sign', [this.account, data])
    this.checkResponse(response, 'signPersonalMessage')
    return decodeSig(response.result!)
  }

  getNativeKey = () => this.account

  async unlock(passphrase: string, duration: number) {
    const response = await this.rpc.call('personal_unlockAccount', [
      this.account,
      passphrase,
      duration,
    ])
    this.checkResponse(response, 'unlock')
    this.unlockTime = currentTimeInSeconds()
    this.unlockDuration = duration
  }

  isUnlocked() {
    return this.unlockTime + this.unlockDuration - this.unlockBufferSeconds > currentTimeInSeconds()
  }

  checkResponse(response: JsonRpcResponse, tag: string) {
    if (response.error) {
      throw new Error(`RpcSigner@${tag} failed with \n'${(response.error as any).message}'`)
    }
  }
}
