import { CeloTx, EncodedTransaction, Signer } from '@celo/connect'
import { EIP712TypedData } from '@celo/utils/src/sign-typed-data-utils'
import WalletConnect from '@walletconnect/client'
import { SessionTypes } from '@walletconnect/types'
import * as ethUtil from 'ethereumjs-util'

/**
 * Implements the signer interface on top of the WalletConnect interface.
 */
export class WalletConnectSigner implements Signer {
  // private client?: WalletConnect

  /**
   * Construct a new instance of a WalletConnectSigner
   */
  constructor(
    protected client: WalletConnect,
    protected session: SessionTypes.Settled,
    protected account: string
  ) {}

  async signTransaction(): Promise<{ v: number; r: Buffer; s: Buffer }> {
    throw new Error('signTransaction unimplemented; use signRawTransaction')
  }

  async signRawTransaction(tx: CeloTx): Promise<EncodedTransaction> {
    const result = await this.client.request({
      topic: this.session.topic,
      chainId: '44787',
      request: {
        method: 'eth_signTransaction',
        params: tx,
      },
    })
    return result
  }

  async signTypedData(data: EIP712TypedData): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const params = [this.account, JSON.stringify(data)]
    const result = await this.client.request({
      topic: this.session.topic,
      chainId: '44787',
      request: {
        method: 'eth_signTypedData',
        params,
      },
    })

    return ethUtil.fromRpcSig(result) as { v: number; r: Buffer; s: Buffer }
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const params = [data, this.account]
    const result = await this.client.request({
      topic: this.session.topic,
      chainId: '44787',
      request: {
        method: 'personal_sign',
        params,
      },
    })

    return ethUtil.fromRpcSig(result) as { v: number; r: Buffer; s: Buffer }
  }

  getNativeKey = () => this.account

  async decrypt(data: Buffer) {
    const params = [this.account, data]
    const result = await this.client.request({
      topic: this.session.topic,
      chainId: '44787',
      request: {
        method: 'personal_decrypt',
        params,
      },
    })
    return Buffer.from(result, 'hex')
  }

  async computeSharedSecret(publicKey: string) {
    const params = [this.account, publicKey]
    const result = await this.client.request({
      topic: this.session.topic,
      chainId: '44787',
      request: {
        method: 'personal_computeSharedSecret',
        params,
      },
    })
    return Buffer.from(result, 'hex')
  }
}
