import debugFactory from 'debug'
import { provider } from 'web3-core'
import { Callback, JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'
import { hasProperty, stopProvider } from '../utils/provider-utils'
import { DefaultRpcCaller, RpcCaller, rpcCallHandler } from '../utils/rpc-caller'
import { TxParamsNormalizer } from '../utils/tx-params-normalizer'
import { LocalWallet } from '../wallets/local-wallet'
import { Wallet } from '../wallets/wallet'

const debug = debugFactory('kit:provider:connection')
const debugPayload = debugFactory('kit:provider:payload')
const debugResponse = debugFactory('kit:provider:response')

enum InterceptedMethods {
  accounts = 'eth_accounts',
  sendTransaction = 'eth_sendTransaction',
  signTransaction = 'eth_signTransaction',
  sign = 'eth_sign',
  personalSign = 'personal_sign',
  signTypedData = 'eth_signTypedData',
}

export class CeloProvider {
  private readonly rpcCaller: RpcCaller
  private readonly paramsPopulator: TxParamsNormalizer
  private alreadyStopped: boolean = false
  wallet: Wallet

  constructor(readonly existingProvider: provider, wallet: Wallet = new LocalWallet()) {
    this.rpcCaller = new DefaultRpcCaller(existingProvider)
    this.paramsPopulator = new TxParamsNormalizer(this.rpcCaller)
    this.wallet = wallet
  }

  addAccount(privateKey: string) {
    if (hasProperty<{ addAccount: (privateKey: string) => void }>(this.wallet, 'addAccount')) {
      this.wallet.addAccount(privateKey)
    } else {
      throw new Error("The wallet used, can't add accounts")
    }
  }

  async getAccounts(): Promise<string[]> {
    const nodeAccountsResp = await this.rpcCaller.call('eth_accounts', [])

    return nodeAccountsResp.result.concat(this.wallet.getAccounts())
  }

  isLocalAccount(address?: string): boolean {
    return this.wallet.hasAccount(address)
  }

  /**
   * Send method as expected by web3.js
   */
  send(payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): void {
    let txParams: any
    let address: string

    debugPayload('%O', payload)

    const decoratedCallback = ((error: Error, result: JsonRpcResponse) => {
      debugResponse('%O', result)
      callback(error as any, result)
    }) as Callback<JsonRpcResponse>

    if (this.alreadyStopped) {
      throw Error('CeloProvider already stopped')
    }

    switch (payload.method) {
      case InterceptedMethods.accounts: {
        rpcCallHandler(payload, this.handleAccounts.bind(this), decoratedCallback)
        return
      }
      case InterceptedMethods.sendTransaction: {
        this.checkPayloadWithAtLeastNParams(payload, 1)
        txParams = payload.params[0]

        if (this.isLocalAccount(txParams.from)) {
          rpcCallHandler(payload, this.handleSendTransaction.bind(this), decoratedCallback)
        } else {
          this.forwardSend(payload, callback)
        }
        return
      }
      case InterceptedMethods.signTransaction: {
        this.checkPayloadWithAtLeastNParams(payload, 1)
        txParams = payload.params[0]

        if (this.isLocalAccount(txParams.from)) {
          rpcCallHandler(payload, this.handleSignTransaction.bind(this), decoratedCallback)
        } else {
          this.forwardSend(payload, callback)
        }
        return
      }
      case InterceptedMethods.sign:
      case InterceptedMethods.personalSign: {
        if (payload.method === InterceptedMethods.sign) {
          this.checkPayloadWithAtLeastNParams(payload, 1)
        } else {
          this.checkPayloadWithAtLeastNParams(payload, 2)
        }
        address = payload.method === InterceptedMethods.sign ? payload.params[0] : payload.params[1]

        if (this.isLocalAccount(address)) {
          rpcCallHandler(payload, this.handleSignPersonalMessage.bind(this), decoratedCallback)
        } else {
          this.forwardSend(payload, callback)
        }

        return
      }
      case InterceptedMethods.signTypedData: {
        this.checkPayloadWithAtLeastNParams(payload, 1)
        address = payload.params[0]

        if (this.isLocalAccount(address)) {
          rpcCallHandler(payload, this.handleSignTypedData.bind(this), decoratedCallback)
        } else {
          this.forwardSend(payload, callback)
        }
        return
      }

      default: {
        this.forwardSend(payload, callback)
        return
      }
    }
  }

  stop() {
    if (this.alreadyStopped) {
      return
    }
    try {
      stopProvider(this.existingProvider)
      this.alreadyStopped = true
    } catch (error) {
      debug(`Failed to close the connection: ${error}`)
    }
  }

  private async handleAccounts(_payload: JsonRpcPayload): Promise<any> {
    return this.getAccounts()
  }

  private async handleSignTypedData(payload: JsonRpcPayload): Promise<any> {
    const [address, typedData] = payload.params
    const signature = this.wallet.signTypedData(address, typedData)
    return signature
  }

  private async handleSignPersonalMessage(payload: JsonRpcPayload): Promise<any> {
    const address = payload.method === 'eth_sign' ? payload.params[0] : payload.params[1]
    const data = payload.method === 'eth_sign' ? payload.params[1] : payload.params[0]
    const ecSignatureHex = this.wallet.signPersonalMessage(address, data)
    return ecSignatureHex
  }

  private async handleSignTransaction(payload: JsonRpcPayload): Promise<any> {
    const txParams = payload.params[0]
    const filledParams = await this.paramsPopulator.populate(txParams)
    const signedTx = await this.wallet.signTransaction(filledParams)
    return { raw: signedTx.raw, tx: txParams }
  }

  private async handleSendTransaction(payload: JsonRpcPayload): Promise<any> {
    const signedTx = await this.handleSignTransaction(payload)
    const response = await this.rpcCaller.call('eth_sendRawTransaction', [signedTx.raw])
    return response.result
  }

  private forwardSend(payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): void {
    this.rpcCaller.send(payload, callback)
  }

  private checkPayloadWithAtLeastNParams(payload: JsonRpcPayload, n: number) {
    if (!payload.params || payload.params.length < n) {
      throw Error('Invalid params')
    }
  }
}
