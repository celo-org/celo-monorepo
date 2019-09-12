import { Callback, ErrorCallback, JSONRPCRequestPayload, Subprovider } from '@0x/subproviders'
import debugFactory from 'debug'
import { JsonRPCResponse, Provider } from 'web3/providers'

const debug = debugFactory('kit:web3:providers:wrapping-subprovider')

export class WrappingSubprovider extends Subprovider {
  private _provider: Provider

  constructor(readonly provider: Provider) {
    super()
    this._provider = provider
  }
  /**
   * @param payload JSON RPC request payload
   * @param next A callback to pass the request to the next subprovider in the stack
   * @param end A callback called once the subprovider is done handling the request
   */
  handleRequest(
    payload: JSONRPCRequestPayload,
    _next: Callback,
    end: ErrorCallback
  ): Promise<void> {
    debug('WrappingSubprovider@handleRequest: %o', payload)
    // Inspired from https://github.com/MetaMask/web3-provider-engine/pull/19/
    return this._provider.send(payload, (err: null | Error, response?: JsonRPCResponse) => {
      if (err != null) {
        debug('WrappingSubprovider@response is error: %s', err)
        end(err)
        return
      }
      if (response == null) {
        end(new Error(`Response is null for ${JSON.stringify(payload)}`))
        return
      }
      if (response.error != null) {
        debug('WrappingSubprovider@response includes error: %o', response)
        end(new Error(response.error))
        return
      }
      debug('WrappingSubprovider@response: %o', response)
      end(null, response.result)
    })
  }
}
