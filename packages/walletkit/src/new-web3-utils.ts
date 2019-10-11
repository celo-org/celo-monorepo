import {
  Callback,
  ErrorCallback,
  JSONRPCRequestPayload,
  Subprovider,
  Web3ProviderEngine,
} from '@0x/subproviders'
import * as util from 'util'
import Web3 from 'web3'
import { JsonRPCResponse, Provider } from 'web3/providers'
import { Logger } from './logger'
import { CeloProvider } from './transaction-utils'

export function getAccountAddressFromPrivateKey(privateKey: string): string {
  if (!privateKey.toLowerCase().startsWith('0x')) {
    privateKey = '0x' + privateKey
  }
  return new Web3().eth.accounts.privateKeyToAccount(privateKey).address
}

// This web3 has signing ability.
export function addLocalAccount(web3: Web3, privateKey: string) {
  const celoProvider = new CeloProvider(privateKey)
  const existingProvider = web3.currentProvider
  let providerEngine: Web3ProviderEngine
  if (existingProvider instanceof Web3ProviderEngine) {
    Logger.debug(
      'new-web3-utils/addLocalAccount',
      'Existing provider is already a Web3ProviderEngine'
    )
    providerEngine = addLocalAccountToExistingProvider(
      existingProvider as Web3ProviderEngine,
      celoProvider
    )
  } else {
    providerEngine = createNewProviderWithLocalAccount(existingProvider, celoProvider)
    web3.setProvider(providerEngine)
  }

  providerEngine.start()
  Logger.debug('new-web3-utils/addLocalAccount', 'Providers configured')
  providerEngine.stop()
}

function addLocalAccountToExistingProvider(
  existingProvider: Web3ProviderEngine,
  localAccountProvider: CeloProvider
): Web3ProviderEngine {
  if (isAccountAlreadyAdded(existingProvider, localAccountProvider)) {
    return existingProvider
  }

  // When a private key has already been added, add a new one before
  // all other providers.
  // I could not find a better way to do this, so, I had to
  // access the private `_providers` field of providerEngine
  // @ts-ignore-next-line
  existingProvider._providers.splice(0, 0, localAccountProvider)
  localAccountProvider.setEngine(existingProvider)
  return existingProvider
}

function createNewProviderWithLocalAccount(
  existingProvider: Provider,
  localAccountProvider: CeloProvider
): Web3ProviderEngine {
  // Create a Web3 Provider Engine
  const providerEngine = new Web3ProviderEngine()
  // Compose our Providers, order matters
  // Celo provider provides signing
  providerEngine.addProvider(localAccountProvider)
  // Use the existing provider to route all other requests
  const subprovider = new SubproviderWithLogging(existingProvider)
  Logger.debug('new-web3-utils/createNewProviderWithLocalAccount', 'Setting up providers...')
  providerEngine.addProvider(subprovider)
  return providerEngine
}

function isAccountAlreadyAdded(
  existingProvider: Web3ProviderEngine,
  localAccountProvider: CeloProvider
): boolean {
  const alreadyAddedAddresses: string[] = []
  // @ts-ignore-next-line
  const providers = existingProvider._providers
  for (const provider of providers) {
    if (provider instanceof CeloProvider) {
      const accounts: string[] = (provider as CeloProvider).getAccounts()
      alreadyAddedAddresses.push.apply(alreadyAddedAddresses, accounts)
    }
  }

  const localAccountAddresses: string[] = localAccountProvider.getAccounts()
  for (const localAccountAddress of localAccountAddresses) {
    if (alreadyAddedAddresses.indexOf(localAccountAddress) < 0) {
      Logger.debug(
        'new-web3-utils/isAccountAlreadyAdded',
        `Account ${localAccountAddress} is not already added, ` +
          `existing accounts are ${alreadyAddedAddresses}`
      )
      return false
    }
  }
  Logger.debug(
    'new-web3-utils/addLocalAccount',
    `Account ${localAccountAddresses} is already added`
  )
  return true
}

class SubproviderWithLogging extends Subprovider {
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
    Logger.debug(
      'new-web3-utils/addLocalAccount',
      `SubproviderWithLogging@handleRequest: ${util.inspect(payload)}`
    )
    // Inspired from https://github.com/MetaMask/web3-provider-engine/pull/19/
    return this._provider.send(payload, (err: null | Error, response?: JsonRPCResponse) => {
      if (err != null) {
        Logger.verbose(
          'new-web3-utils/addLocalAccount',
          `SubproviderWithLogging@response is error: ${err}`
        )
        end(err)
        return
      }
      if (response == null) {
        end(new Error(`Response is null for ${JSON.stringify(payload)}`))
        return
      }
      if (response.error != null) {
        Logger.verbose(
          'new-web3-utils/addLocalAccount',
          `SubproviderWithLogging@response includes error: ${response}`
        )
        end(new Error(response.error))
        return
      }
      Logger.debug(
        'new-web3-utils/addLocalAccount',
        `SubproviderWithLogging@response: ${util.inspect(response)}`
      )
      end(null, response.result)
    })
  }
}
