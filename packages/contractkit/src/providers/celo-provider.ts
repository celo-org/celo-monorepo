import { JSONRPCRequestPayload, Web3ProviderEngine } from '@0x/subproviders'
import debugFactory from 'debug'
import { JsonRPCResponse, Provider } from 'web3/providers'
import { Callback } from 'web3/types'
import { CeloPrivateKeysWalletProvider } from './celo-private-keys-subprovider'
import { WrappingSubprovider } from './wrapping-subprovider'

const debug = debugFactory('kit:provider:celo-provider')

type OnFn = (event: string, handler: () => void) => void
export class CeloProvider implements Provider {
  public readonly on: null | OnFn = null
  private readonly providerEngine: Web3ProviderEngine
  private readonly localSigningProvider: CeloPrivateKeysWalletProvider
  private readonly underlyingProvider: Provider

  constructor(readonly existingProvider: Provider, readonly privateKey: string) {
    debug('Setting up providers...')
    // Create a Web3 Provider Engine
    this.providerEngine = new Web3ProviderEngine()
    // Compose our Providers, order matters
    // First add provider for signing
    this.localSigningProvider = new CeloPrivateKeysWalletProvider(privateKey)
    this.providerEngine.addProvider(this.localSigningProvider)
    // Use the existing provider to route all other requests
    const wrappingSubprovider = new WrappingSubprovider(existingProvider)
    this.providerEngine.addProvider(wrappingSubprovider)
    this.underlyingProvider = existingProvider

    // Initializer "on" conditionally.
    if (existingProvider.hasOwnProperty('on')) {
      this.on = (event: string, handler: () => void): void => {
        this.providerEngine.on(event, handler)
      }
    }
  }

  addAccount(privateKey: string): CeloProvider {
    this.localSigningProvider.addAccount(privateKey)
    return this
  }

  /**
   * Send method as expected by web3.js
   */
  send(payload: JSONRPCRequestPayload, callback: Callback<JsonRPCResponse>): void {
    this.sendAsync(payload, callback)
  }

  sendAsync(payload: JSONRPCRequestPayload, callback: Callback<JsonRPCResponse>): void {
    // callback typing from Web3ProviderEngine are wrong
    this.providerEngine.sendAsync(payload, callback as any)
  }

  start(callback?: () => void): void {
    this.providerEngine.start(callback)
  }

  stop() {
    this.providerEngine.stop()

    try {
      if (this.underlyingProvider.hasOwnProperty('stop')) {
        // @ts-ignore
        this.underlyingProvider.stop()
      }

      // Close the web3 connection or the CLI hangs forever.
      if (this.underlyingProvider && this.underlyingProvider.hasOwnProperty('connection')) {
        // @ts-ignore
        const connection = this.underlyingProvider.connection
        if (connection.hasOwnProperty('_connection')) {
          connection._connection.close()
        }
      }
    } catch (error) {
      debug(`Failed to close the connection: ${error}`)
    }
  }
}
