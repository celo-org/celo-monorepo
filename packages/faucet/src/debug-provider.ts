import { JsonRpcPayload, JsonRpcResponse, Provider } from '@celo/connect'
import Web3 from 'web3'

export type Callback<T> = (error: Error | null, result?: T) => void

class DebugProvider {
  constructor(private provider: Provider) {}

  send(payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): any {
    console.log('rpc: -> %O', payload)

    const callbackDecorator = (error: Error | null, result?: JsonRpcResponse) => {
      console.log('rpc: <- %O', payload)
      callback(error, result)
    }
    return this.provider.send(payload, callbackDecorator)
  }
}

export function wrap(provider: Provider) {
  return new DebugProvider(provider)
}

export function injectDebugProvider(web3: Web3) {
  // TODO fix types
  web3.setProvider(wrap(web3.currentProvider as Provider) as any)
}
