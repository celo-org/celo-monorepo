import debugFactory from 'debug'
import { Socket } from 'net'
import { Callback, JsonRPCRequest, JsonRPCResponse, Provider } from 'web3/providers'
import { MissingTxParamsPopulator } from '../utils/missing-tx-params-populator'
import { IRpcCaller, RpcCaller, rpcCallHandler } from '../utils/rpc-caller'
import { IWallet, Wallet } from '../utils/wallet'

const debug = debugFactory('kit:provider:celo-provider:connection')
const debugPayloadExistingProvider = debugFactory('kit:existing-provider:rpc:payload')
const debugResponseExistingProvider = debugFactory('kit:existing-provider:rpc:response')
const debugPayloadCeloProvider = debugFactory('kit:celo-provider:rpc:payload')
const debugResponseCeloProvider = debugFactory('kit:celo-provider:rpc:response')

export class CeloProvider implements Provider {
  private readonly wallet: IWallet
  private readonly rpcCaller: IRpcCaller
  private readonly paramsPopulator: MissingTxParamsPopulator
  private alreadyStopped: boolean = false

  constructor(readonly existingProvider: Provider) {
    this.rpcCaller = new RpcCaller(existingProvider)
    this.paramsPopulator = new MissingTxParamsPopulator(this.rpcCaller)
    this.wallet = new Wallet()
  }

  addAccount(privateKey: string) {
    this.wallet.addAccount(privateKey)
  }

  async getAccounts(): Promise<string[]> {
    const nodeAccountsResp = await this.rpcCaller.call('eth_accounts', [])

    return nodeAccountsResp.result.concat(this.wallet.getAccounts())
  }

  isLocalAccount(address?: string): boolean {
    return address != null && this.wallet.hasAccount(address.toLowerCase())
  }

  /**
   * Send method as expected by web3.js
   */
  send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): void {
    let txParams: any
    let address: string

    if (this.alreadyStopped) {
      throw Error('CeloProvider already stopped')
    }

    switch (payload.method) {
      case 'eth_accounts': {
        rpcCallHandler(
          payload,
          this.handleAccounts.bind(this),
          this.celoCallback(payload, callback)
        )
        return
      }
      case 'eth_sendTransaction': {
        this.checkPayloadWithAtLeastNParams(payload, 1)
        txParams = payload.params[0]

        if (this.isLocalAccount(txParams.from)) {
          rpcCallHandler(
            payload,
            this.handleSendTransaction.bind(this),
            this.celoCallback(payload, callback)
          )
        } else {
          this._forwardSend(payload, callback)
        }
        return
      }
      case 'eth_signTransaction': {
        this.checkPayloadWithAtLeastNParams(payload, 1)
        txParams = payload.params[0]

        if (this.isLocalAccount(txParams.from)) {
          rpcCallHandler(
            payload,
            this.handleSignTransaction.bind(this),
            this.celoCallback(payload, callback)
          )
        } else {
          this._forwardSend(payload, callback)
        }
        return
      }
      case 'eth_sign':
      case 'personal_sign': {
        if (payload.method === 'eth_sign') {
          this.checkPayloadWithAtLeastNParams(payload, 1)
        } else {
          this.checkPayloadWithAtLeastNParams(payload, 2)
        }
        address = payload.method === 'eth_sign' ? payload.params[0] : payload.params[1]

        if (this.isLocalAccount(address)) {
          rpcCallHandler(payload, this.handleSign.bind(this), this.celoCallback(payload, callback))
        } else {
          this._forwardSend(payload, callback)
        }

        return
      }
      case 'eth_signTypedData': {
        this.checkPayloadWithAtLeastNParams(payload, 1)
        address = payload.params[0]

        if (this.isLocalAccount(address)) {
          rpcCallHandler(
            payload,
            this.handleSignTypedData.bind(this),
            this.celoCallback(payload, callback)
          )
        } else {
          this._forwardSend(payload, callback)
        }
        return
      }

      default: {
        this._forwardSend(payload, callback)
        return
      }
    }
  }

  stop() {
    if (this.alreadyStopped) {
      return
    }
    try {
      if (this.existingProvider.hasOwnProperty('stop')) {
        // @ts-ignore
        this.existingProvider.stop()
      }

      // Close the web3 connection or the CLI hangs forever.
      if (this.existingProvider && this.existingProvider.hasOwnProperty('connection')) {
        // Close the web3 connection or the CLI hangs forever.
        // @ts-ignore
        const connection = this.existingProvider.connection
        // Net (IPC provider)
        if (connection instanceof Socket) {
          connection.destroy()
        } else {
          connection.close()
        }
      }
      this.alreadyStopped = true
    } catch (error) {
      debug(`Failed to close the connection: ${error}`)
    }
  }

  private async handleAccounts(_payload: JsonRPCRequest): Promise<any> {
    return this.getAccounts()
  }

  private async handleSignTypedData(payload: JsonRPCRequest): Promise<any> {
    const [address, typedData] = payload.params
    const signature = this.wallet.signTypedData(address, typedData)
    return signature
  }

  private async handleSign(payload: JsonRPCRequest): Promise<any> {
    const address = payload.method === 'eth_sign' ? payload.params[0] : payload.params[1]
    const data = payload.method === 'eth_sign' ? payload.params[1] : payload.params[0]
    const ecSignatureHex = this.wallet.signPersonalMessage(address, data)
    return ecSignatureHex
  }

  private async handleSignTransaction(payload: JsonRPCRequest): Promise<any> {
    const txParams = payload.params[0]
    const filledParams = await this.paramsPopulator.populate(txParams)
    const signedTx = await this.wallet.signTransaction(filledParams)
    return { raw: signedTx.raw, tx: txParams }
  }

  private async handleSendTransaction(payload: JsonRPCRequest): Promise<any> {
    const txParams = payload.params[0]
    const filledParams = await this.paramsPopulator.populate(txParams)
    const signedTx = await this.wallet.signTransaction(filledParams)
    const response = await this.rpcCaller.call('eth_sendRawTransaction', [signedTx.raw])
    return response.result
  }

  private _forwardSend(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): void {
    const decoratedCallback = this.debugDecoratorFn(
      payload,
      callback,
      debugPayloadExistingProvider,
      debugResponseExistingProvider
    )
    this.existingProvider.send(payload, decoratedCallback)
  }

  private celoCallback(
    payload: JsonRPCRequest,
    callback: Callback<JsonRPCResponse>
  ): Callback<JsonRPCResponse> {
    return this.debugDecoratorFn(
      payload,
      callback,
      debugPayloadCeloProvider,
      debugResponseCeloProvider
    )
  }

  private debugDecoratorFn(
    payload: JsonRPCRequest,
    callback: Callback<JsonRPCResponse>,
    payloadDebbug: debugFactory.Debugger,
    responseDebbug: debugFactory.Debugger
  ): Callback<JsonRPCResponse> {
    payloadDebbug('%O', payload)

    const decoratedCallback = (error: Error, result: JsonRPCResponse) => {
      responseDebbug('%O', result)
      callback(error as any, result)
    }

    return decoratedCallback as Callback<JsonRPCResponse>
  }

  private checkPayloadWithAtLeastNParams(payload: JsonRPCRequest, n: number) {
    if (!payload.params || payload.params.length < n) {
      throw Error('Invalid params')
    }
  }
}
