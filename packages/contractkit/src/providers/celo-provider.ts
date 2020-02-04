import debugFactory from 'debug'
import { Socket } from 'net'
import { Callback, JsonRPCRequest, JsonRPCResponse, Provider } from 'web3/providers'
import { MissingTxParamsPopulator } from '../utils/missing-tx-params-populator'
import { RpcCaller, rpcCallHandler } from '../utils/rpc-caller'
import { IWallet, Wallet } from '../utils/wallet'

const debug = debugFactory('kit:provider:celo-provider:connection')
const debugPayload = debugFactory('kit:provider:celo-provider:rpc:payload')
const debugResponse = debugFactory('kit:provider:celo-provider:rpc:response')

export class CeloProvider implements Provider {
  private readonly wallet: IWallet = new Wallet()
  private readonly rpcCaller: RpcCaller
  private readonly paramsPopulator: MissingTxParamsPopulator
  private alreadyStopped: boolean = false

  constructor(readonly existingProvider: Provider) {
    this.rpcCaller = new RpcCaller(existingProvider)
    this.paramsPopulator = new MissingTxParamsPopulator(this.rpcCaller)
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
    debugPayload('%O', payload)

    const callbackDecorator = (error: Error, result: JsonRPCResponse) => {
      debugResponse('%O', result)
      callback(error as any, result)
    }
    this.sendAsync(payload, callbackDecorator as Callback<JsonRPCResponse>)
  }

  sendAsync(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): void {
    let txParams: any
    let address: string

    if (this.alreadyStopped) {
      throw Error('CeloProvider already stopped')
    }

    switch (payload.method) {
      case 'eth_accounts': {
        rpcCallHandler(payload, this.handleAccounts.bind(this), callback)
        return
      }
      case 'eth_sendTransaction': {
        // TODO params no existe, params no es un array
        txParams = payload.params[0]

        if (this.isLocalAccount(txParams.from)) {
          rpcCallHandler(payload, this.handleSendTransaction.bind(this), callback)
        } else {
          this._forwardSend(payload, callback)
        }
        return
      }
      case 'eth_signTransaction': {
        txParams = payload.params[0]
        if (this.isLocalAccount(txParams.from)) {
          rpcCallHandler(payload, this.handleSignTransaction.bind(this), callback)
        } else {
          this._forwardSend(payload, callback)
        }
        return
      }
      case 'eth_sign':
      case 'personal_sign': {
        address = payload.method === 'eth_sign' ? payload.params[0] : payload.params[1]

        if (this.isLocalAccount(address)) {
          rpcCallHandler(payload, this.handleSign.bind(this), callback)
        } else {
          this._forwardSend(payload, callback)
        }

        return
      }
      case 'eth_signTypedData': {
        address = payload.params[0]
        if (this.isLocalAccount(address)) {
          rpcCallHandler(payload, this.handleSignTypedData.bind(this), callback)
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
    const signature = this.wallet.signTypedDataAsync(address, typedData)
    return signature
  }

  private async handleSign(payload: JsonRPCRequest): Promise<any> {
    const address = payload.method === 'eth_sign' ? payload.params[0] : payload.params[1]
    const data = payload.method === 'eth_sign' ? payload.params[1] : payload.params[0]
    const ecSignatureHex = this.wallet.signPersonalMessageAsync(data, address)
    return ecSignatureHex
  }

  private async handleSignTransaction(payload: JsonRPCRequest): Promise<any> {
    const txParams = payload.params[0]
    const filledParams = await this.paramsPopulator.populate(txParams)
    const signedTx = await this.wallet.signTransactionAsync(filledParams)
    return { raw: signedTx, tx: txParams }
  }

  private async handleSendTransaction(payload: JsonRPCRequest): Promise<any> {
    const txParams = payload.params[0]
    const filledParams = await this.paramsPopulator.populate(txParams)
    const signedTx = await this.wallet.signTransactionAsync(filledParams)
    const response = await this.rpcCaller.call('eth_sendRawTransaction', [signedTx])
    return response.result
  }

  private _forwardSend(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): void {
    this.existingProvider.send(payload, callback)
  }
}
