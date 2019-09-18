import Web3 from 'web3'
import { Callback, JsonRPCRequest, JsonRPCResponse, Provider } from 'web3/providers'

class DebugProvider implements Provider {
  constructor(private provider: Provider) {}

  send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): any {
    console.log('rpc: -> %O', payload)

    const callbackDecorator = (error: Error, result: JsonRPCResponse) => {
      console.log('rpc: <- %O', payload)
      callback(error as any, result)
    }
    return this.provider.send(payload, callbackDecorator as any)
  }
}

export function wrap(provider: Provider) {
  return new DebugProvider(provider)
}

export function injectDebugProvider(web3: Web3) {
  web3.setProvider(wrap(web3.currentProvider))
}
