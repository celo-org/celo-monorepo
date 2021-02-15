import { Signer } from '@celo/connect'
import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'
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

  async signTypedData(_: EIP712TypedData): Promise<{ v: number; r: Buffer; s: Buffer }> {
    return {
      v: 0,
      r: Buffer.from([]),
      s: Buffer.from([]),
    }
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

  async decrypt(_: Buffer) {
    return Buffer.from([])
  }

  computeSharedSecret(_publicKey: string) {
    return Promise.resolve(Buffer.from([]))
  }
}
