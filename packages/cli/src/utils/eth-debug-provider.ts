import debugFactory from 'debug'
import Web3 from 'web3'
import { Callback, JsonRPCRequest, JsonRPCResponse, Provider } from 'web3/providers'

const debugPayload = debugFactory('web:rpc:payload')
const debugResponse = debugFactory('web:rpc:response')

class DebugProvider implements Provider {
  constructor(private provider: Provider) {}

  send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): any {
    debugPayload('%O', payload)

    const callbackDecorator = (error: Error, result: JsonRPCResponse) => {
      debugResponse('%O', result)
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
