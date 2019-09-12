import { JSONRPCRequestPayload, JSONRPCResponsePayload, Web3ProviderEngine } from '@0x/subproviders'
import debugFactory from 'debug'
import { Provider } from 'web3/providers'
import { CeloPrivateKeysWalletProvider } from './celo-private-keys-subprovider'
import { WrappingSubprovider } from './wrapping-subprovider'

const debug = debugFactory('kit:provider:celo-provider')

export class CeloProvider implements Provider {
  public readonly on: null | any
  private web3ProviderEngine: Web3ProviderEngine
  private localSigningProvider: CeloPrivateKeysWalletProvider

  constructor(readonly existingProvider: Provider, readonly privateKey: string) {
    debug('Setting up providers...')
    this.localSigningProvider = new CeloPrivateKeysWalletProvider(privateKey)
    // Create a Web3 Provider Engine
    const providerEngine = new Web3ProviderEngine()
    // Compose our Providers, order matters
    // First add provider for signing
    providerEngine.addProvider(this.localSigningProvider)
    // Use the existing provider to route all other requests
    const wrappingSubprovider = new WrappingSubprovider(existingProvider)
    providerEngine.addProvider(wrappingSubprovider)
    this.web3ProviderEngine = providerEngine

    // Initializer "on" conditionally.
    if (existingProvider.hasOwnProperty('on')) {
      const func = (event: string, handler: () => void): void => {
        this.web3ProviderEngine.on(event, handler)
      }
      this.on = func
    } else {
      this.on = null
    }
  }

  addAccount(privateKey: string): CeloProvider {
    this.localSigningProvider.addAccount(privateKey)
    return this
  }

  send(payload: JSONRPCRequestPayload): void {
    this.web3ProviderEngine.send(payload)
  }

  sendAsync(
    payload: JSONRPCRequestPayload,
    callback: (error: null | Error, response: JSONRPCResponsePayload) => void
  ): void {
    this.web3ProviderEngine.sendAsync(payload, callback)
  }

  start(callback?: () => void): void {
    this.web3ProviderEngine.start(callback)
  }

  stop() {
    this.web3ProviderEngine.stop()
  }
}
