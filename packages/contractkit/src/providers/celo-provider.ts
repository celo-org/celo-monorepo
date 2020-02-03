import BigNumber from 'bignumber.js'
import debugFactory from 'debug'
import * as ethUtil from 'ethereumjs-util'
import Web3 from 'web3'
import { Callback, JsonRPCRequest, JsonRPCResponse, Provider } from 'web3/providers'
import { signTransaction } from '../utils/signing-utils'
import { EIP712TypedData, generateTypedDataHash } from '../utils/sign_typed_data_utils'

// const debug = debugFactory('kit:provider:celo-provider')

const debugPayload = debugFactory('kit:provider:celo-provider:rpc:payload')
const debugResponse = debugFactory('kit:provider:celo-provider:rpc:response')

// Default gateway fee to send the serving full-node on each transaction.
// TODO(nategraf): Provide a method of fecthing the gateway fee value from the full-node peer.
const DefaultGatewayFee = new BigNumber(10000)

function getPrivateKeyWithout0xPrefix(privateKey: string) {
  return privateKey.toLowerCase().startsWith('0x') ? privateKey.substring(2) : privateKey
}

export function generateAccountAddressFromPrivateKey(privateKey: string): string {
  if (!privateKey.toLowerCase().startsWith('0x')) {
    privateKey = '0x' + privateKey
  }
  return new Web3().eth.accounts.privateKeyToAccount(privateKey).address
}

export interface PartialTxParams {
  nonce: string
  gasPrice?: string
  gas: string
  to: string
  from: string
  value?: string
  data?: string
  chainId: number
  gatewayFeeRecipient?: string
  gatewayFee?: string
  feeCurrency?: string
}

function toRPCResponse(payload: JsonRPCRequest, result: any, error?: Error): JsonRPCResponse {
  const response: JsonRPCResponse = {
    id: payload.id,
    jsonrpc: payload.jsonrpc,
    result,
  }

  if (error != null) {
    ;(response as any).error = {
      message: error.stack || error.message || error,
      code: -32000,
    }
  }
  return response
}

function isEmpty(value: string | undefined) {
  return (
    value === undefined ||
    value === null ||
    value === '0' ||
    value.toLowerCase() === '0x' ||
    value.toLowerCase() === '0x0'
  )
}

// Ported from: https://github.com/MetaMask/provider-engine/blob/master/util/random-id.js
function getRandomId(): number {
  const extraDigits = 3
  const baseTen = 10
  // 13 time digits
  const datePart = new Date().getTime() * Math.pow(baseTen, extraDigits)
  // 3 random digits
  const extraPart = Math.floor(Math.random() * Math.pow(baseTen, extraDigits))
  // 16 digits
  return datePart + extraPart
}

export class NewCeloProvider implements Provider {
  // Account addresses are hex-encoded, lower case alphabets
  private readonly accountAddressToPrivateKey = new Map<string, string>()
  private chainId: number | null = null
  private gatewayFeeRecipient: string | null = null

  constructor(readonly existingProvider: Provider) {}

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

  addAccount(privateKey: string) {
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    privateKey = '0x' + getPrivateKeyWithout0xPrefix(privateKey)
    const accountAddress = generateAccountAddressFromPrivateKey(privateKey).toLowerCase()
    if (this.accountAddressToPrivateKey.has(accountAddress)) {
      return
    }
    this.accountAddressToPrivateKey.set(accountAddress, privateKey)
  }

  getAccounts(): string[] {
    // TODO FORWARD also to node
    return Array.from(this.accountAddressToPrivateKey.keys())
  }

  isLocalAccount(address?: string): boolean {
    return address != null && this.accountAddressToPrivateKey.has(address.toLowerCase())
  }

  sendAsync(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): void {
    let txParams: any
    let address: string

    switch (payload.method) {
      case 'eth_accounts':
        const accounts = this.getAccounts()
        callback(null, {
          id: payload.id,
          jsonrpc: payload.jsonrpc,
          result: accounts,
        })
        return
      case 'eth_sendTransaction':
        txParams = payload.params[0]

        if (this.isLocalAccount(txParams.from)) {
          this._handleSendTransaction(payload, callback)
        } else {
          this._forwardSend(payload, callback)
        }
        return
      case 'eth_signTransaction':
        txParams = payload.params[0]
        if (this.isLocalAccount(txParams.from)) {
          this._handleSignTransaction(payload, callback)
        } else {
          this._forwardSend(payload, callback)
        }
        return

      case 'eth_sign':
      case 'personal_sign':
        address = payload.method === 'eth_sign' ? payload.params[0] : payload.params[1]

        if (this.isLocalAccount(address)) {
          this._handleSign(payload, callback)
        } else {
          this._forwardSend(payload, callback)
        }

        return
      case 'eth_signTypedData':
        address = payload.params[0]
        if (this.isLocalAccount(address)) {
          this._handleSignTypedData(payload, callback)
        } else {
          this._forwardSend(payload, callback)
        }
        return

      default:
        this._forwardSend(payload, callback)
        return
    }
  }

  private async _handleSignTypedData(
    payload: JsonRPCRequest,
    callback: Callback<JsonRPCResponse>
  ): Promise<void> {
    try {
      const [address, typedData] = payload.params
      const signature = await this.signTypedDataAsync(address, typedData)
      callback(null, toRPCResponse(payload, signature))
    } catch (err) {
      callback(err, toRPCResponse(payload, null, err))
    }
    return
  }

  private async _handleSign(
    payload: JsonRPCRequest,
    callback: Callback<JsonRPCResponse>
  ): Promise<void> {
    const address = payload.method === 'eth_sign' ? payload.params[0] : payload.params[1]
    const data = payload.method === 'eth_sign' ? payload.params[1] : payload.params[0]
    try {
      const ecSignatureHex = await this.signPersonalMessageAsync(data, address)
      callback(null, toRPCResponse(payload, ecSignatureHex))
    } catch (err) {
      callback(err, toRPCResponse(payload, null, err))
    }
  }

  private async _handleSignTransaction(
    payload: JsonRPCRequest,
    callback: Callback<JsonRPCResponse>
  ): Promise<void> {
    try {
      const txParams = payload.params[0]
      const filledParams = await this._populateMissingTxParamsAsync(txParams)
      const signedTx = await this.signTransactionAsync(filledParams)
      const result = {
        raw: signedTx,
        tx: txParams,
      }
      callback(null, toRPCResponse(payload, result))
    } catch (err) {
      callback(err, toRPCResponse(payload, null, err))
    }
  }

  private async _handleSendTransaction(
    payload: JsonRPCRequest,
    callback: Callback<JsonRPCResponse>
  ): Promise<void> {
    try {
      const txParams = payload.params[0]
      const filledParams = await this._populateMissingTxParamsAsync(txParams)
      const signedTx = await this.signTransactionAsync(filledParams)
      const response = await this.rpcCall('eth_sendRawTransaction', [signedTx])
      callback(null, toRPCResponse(payload, response.result))
    } catch (err) {
      callback(err, toRPCResponse(payload, null, err))
    }
  }

  private async _populateMissingTxParamsAsync(
    partialTxParams: PartialTxParams
  ): Promise<PartialTxParams> {
    const txParams = { ...partialTxParams }

    if (txParams.chainId == null) {
      txParams.chainId = await this.getChainId()
    }

    if (txParams.nonce == null) {
      txParams.nonce = await this.getNonce(txParams.from)
    }

    if (isEmpty(txParams.gas)) {
      const gasResult = await this.rpcCall('eth_estimateGas', [txParams])
      const gas = gasResult.result.toString()
      txParams.gas = gas
    }

    if (isEmpty(txParams.gatewayFeeRecipient)) {
      txParams.gatewayFeeRecipient = await this.getCoinbase()
    }
    if (!isEmpty(txParams.gatewayFeeRecipient) && isEmpty(txParams.gatewayFee)) {
      txParams.gatewayFee = DefaultGatewayFee.toString(16)
    }

    if (isEmpty(txParams.gasPrice)) {
      txParams.gasPrice = await this.getGasPrice(txParams.feeCurrency)
    }

    return txParams
  }

  private _forwardSend(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): void {
    this.existingProvider.send(payload, callback)
  }

  private getPrivateKeyFor(account: string): string {
    const maybePk = this.accountAddressToPrivateKey.get(account.toLowerCase())
    if (maybePk == null) {
      throw new Error(`tx-signing@getPrivateKey: ForPrivate key not found for ${account}`)
    }
    return maybePk
  }

  private async getChainId(): Promise<number> {
    if (this.chainId === null) {
      // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#net_version
      const result = await this.rpcCall('net_version', [])
      this.chainId = parseInt(result.result.toString(), 10)
    }
    return this.chainId
  }

  private async getNonce(address: string): Promise<string> {
    // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_gettransactioncount
    const result = await this.rpcCall('eth_getTransactionCount', [address, 'pending'])
    const nonce = result.result.toString()
    return nonce
  }

  private async getCoinbase(): Promise<string> {
    if (this.gatewayFeeRecipient === null) {
      // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_coinbase
      const result = await this.rpcCall('eth_coinbase', [])
      this.gatewayFeeRecipient = result.result.toString()
    }
    if (this.gatewayFeeRecipient == null) {
      throw new Error(
        `Coinbase is null, we are not connected to a full node, cannot sign transactions locally`
      )
    }
    return this.gatewayFeeRecipient
  }

  private async getGasPrice(feeCurrency: string | undefined): Promise<string | undefined> {
    // Gold Token
    if (!feeCurrency) {
      return this.getGasPriceInCeloGold()
    }
    throw new Error(
      `celo-private-keys-subprovider@getGasPrice: gas price for ` +
        `currency ${feeCurrency} cannot be computed in the CeloPrivateKeysWalletProvider, ` +
        ' pass it explicitly'
    )
  }

  private async getGasPriceInCeloGold(): Promise<string> {
    // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_gasprice
    const result = await this.rpcCall('eth_gasPrice', [])
    const gasPriceInHex = result.result.toString()
    return gasPriceInHex
  }

  public async rpcCall(method: string, params: any[]): Promise<JsonRPCResponse> {
    return new Promise((resolve, reject) => {
      const payload: JsonRPCRequest = {
        id: getRandomId(),
        jsonrpc: '2.0',
        method,
        params,
      }
      this.existingProvider.send(payload, ((err: any, response: JsonRPCResponse) => {
        if (err != null) {
          reject(err)
        } else {
          resolve(response)
        }
      }) as Callback<JsonRPCResponse>)
    })
  }

  public async signTransactionAsync(txParams: PartialTxParams): Promise<string> {
    const signedTx = await signTransaction(txParams, this.getPrivateKeyFor(txParams.from))
    const rawTransaction = signedTx.rawTransaction.toString('hex')
    return rawTransaction
  }

  /**
   * Sign a personal Ethereum signed message. The signing address will be calculated from the private key.
   * The address must be provided it must match the address calculated from the private key.
   * If you've added this Subprovider to your app's provider, you can simply send an `eth_sign`
   * or `personal_sign` JSON RPC request, and this method will be called auto-magically.
   * If you are not using this via a ProviderEngine instance, you can call it directly.
   * @param data Hex string message to sign
   * @param address Address of the account to sign with
   * @return Signature hex string (order: rsv)
   */
  public async signPersonalMessageAsync(data: string, address: string): Promise<string> {
    // TODO add @celo/utils check hex string
    // assert.isHexString('data', data)

    const dataBuff = ethUtil.toBuffer(data)
    const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff)
    const pk = this.getPrivateKeyFor(address)
    const pkBuffer = Buffer.from(pk, 'hex')

    const sig = ethUtil.ecsign(msgHashBuff, pkBuffer)
    const rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s)
    return rpcSig
  }
  /**
   * Sign an EIP712 Typed Data message. The signing address will be calculated from the private key.
   * The address must be provided it must match the address calculated from the private key.
   * If you've added this Subprovider to your app's provider, you can simply send an `eth_signTypedData`
   * JSON RPC request, and this method will be called auto-magically.
   * If you are not using this via a ProviderEngine instance, you can call it directly.
   * @param address Address of the account to sign with
   * @param data the typed data object
   * @return Signature hex string (order: rsv)
   */
  public async signTypedDataAsync(address: string, typedData: EIP712TypedData): Promise<string> {
    // if (typedData === undefined) {
    //   throw new Error(WalletSubproviderErrors.DataMissingForSignTypedData)
    // }
    const pk = this.getPrivateKeyFor(address)
    const pkBuffer = Buffer.from(pk, 'hex')

    const dataBuff = generateTypedDataHash(typedData)
    const sig = ethUtil.ecsign(dataBuff, pkBuffer)
    const rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s)
    return rpcSig
  }
}

// export class CeloProvider implements Provider {
//   public readonly on: null | OnFn = null
//   private readonly providerEngine: Web3ProviderEngine
//   private readonly localSigningProvider: CeloPrivateKeysWalletProvider
//   private readonly underlyingProvider: Provider

//   constructor(readonly existingProvider: Provider) {
//     debug('Setting up providers...')
//     // Create a Web3 Provider Engine
//     this.providerEngine = new Web3ProviderEngine()
//     // Compose our Providers, order matters
//     // First add provider for signing
//     this.localSigningProvider = new CeloPrivateKeysWalletProvider()
//     this.providerEngine.addProvider(this.localSigningProvider)
//     // Use the existing provider to route all other requests
//     const wrappingSubprovider = new WrappingSubprovider(existingProvider)
//     this.providerEngine.addProvider(wrappingSubprovider)
//     this.underlyingProvider = existingProvider

//     // Initializer "on" conditionally.
//     if (existingProvider.hasOwnProperty('on')) {
//       this.on = (event: string, handler: () => void): void => {
//         this.providerEngine.on(event, handler)
//       }
//     }
//   }

//   addAccount(privateKey: string): CeloProvider {
//     this.localSigningProvider.addAccount(privateKey)
//     return this
//   }

//   /**
//    * Send method as expected by web3.js
//    */
//   send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): void {
//     debugPayload('%O', payload)

//     const callbackDecorator = (error: Error, result: JsonRPCResponse) => {
//       debugResponse('%O', result)
//       callback(error as any, result)
//     }
//     this.sendAsync(payload, callbackDecorator as Callback<JsonRPCResponse>)
//   }

//   sendAsync(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): void {
//     // callback typing from Web3ProviderEngine are wrong
//     this.providerEngine.sendAsync(payload, callback as any)
//   }

//   start(callback?: () => void): void {
//     this.providerEngine.start(callback)
//   }

//   stop() {
//     this.providerEngine.stop()

//     try {
//       if (this.underlyingProvider.hasOwnProperty('stop')) {
//         // @ts-ignore
//         this.underlyingProvider.stop()
//       }

//       // Close the web3 connection or the CLI hangs forever.
//       if (this.underlyingProvider && this.underlyingProvider.hasOwnProperty('connection')) {
//         // Close the web3 connection or the CLI hangs forever.
//         // @ts-ignore
//         const connection = this.underlyingProvider.connection
//         // Net (IPC provider)
//         if (connection instanceof Socket) {
//           connection.destroy()
//         } else {
//           connection.close()
//         }
//       }
//     } catch (error) {
//       debug(`Failed to close the connection: ${error}`)
//     }
//   }
// }

// type OnFn = (event: string, handler: () => void) => void

class MissingTxParamsPopulator {
  constructor(rpc: RpcCaller)
  populate(partialTxParams: PartialTxParams): Promise<PartialTxParams>
}

class RpcCaller {
  constructor(provider: Provider) {}

  rpcCall(method: string, params: [])
}
