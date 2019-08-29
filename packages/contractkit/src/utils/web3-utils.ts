import {
  Callback,
  ErrorCallback,
  JSONRPCRequestPayload,
  Subprovider,
  Web3ProviderEngine,
} from '@0x/subproviders'
import debugFactory from 'debug'
import Web3 from 'web3'
import { JsonRPCResponse, Provider } from 'web3/providers'
import { CeloProvider } from './tx-signing'

const debug = debugFactory('kit:web3:utils')

// This web3 has signing ability.
export async function addLocalAccount(web3: Web3, privateKey: string): Promise<Web3> {
  const celoProvider = new CeloProvider(privateKey)
  // Create a Web3 Provider Engine
  const providerEngine = new Web3ProviderEngine()
  // Compose our Providers, order matters
  // Celo provider provides signing
  providerEngine.addProvider(celoProvider)
  // Use the existing provider to route all other requests
  const existingProvider = web3.currentProvider
  const wrappingSubprovider = new WrappingSubprovider(existingProvider)

  debug('Setting up providers...')
  providerEngine.addProvider(wrappingSubprovider)
  providerEngine.start()
  web3.setProvider(providerEngine)
  debug('Providers configured')
  return web3
}

class WrappingSubprovider extends Subprovider {
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
