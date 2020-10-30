import Web3 from 'web3'
import { provider as Provider } from 'web3-core'
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'

export type Callback<T> = (error: Error | null, result?: T) => void

class DebugProvider {
  constructor(private provider: Provider) {}

  send(payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): any {
    console.log('rpc: -> %O', payload)

    const callbackDecorator = (error: Error, result: JsonRpcResponse) => {
      console.log('rpc: <- %O', payload)
      callback(error as any, result)
    }
    // TODO fix types
    return (this.provider! as any).send(payload, callbackDecorator as any)
  }
}

export function wrap(provider: Provider) {
  return new DebugProvider(provider)
}

export function injectDebugProvider(web3: Web3) {
  // TODO fix types
  web3.setProvider(wrap(web3.currentProvider) as any)
}
