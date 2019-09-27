import debugFactory from 'debug'
import Web3 from 'web3'
import { CeloProvider } from '../providers/celo-provider'
import { Web3ContractCache } from '../web3-contract-cache'

const debug = debugFactory('kit:web3:utils')

// Return the modified web3 object for chaining
export function addLocalAccount(
  web3: Web3,
  web3ContractsCache: Web3ContractCache,
  privateKey: string
): Web3 {
  const existingProvider = web3.currentProvider
  if (existingProvider instanceof CeloProvider) {
    const celoProvider = existingProvider as CeloProvider
    celoProvider.addAccount(privateKey)
  } else {
    const celoProvider = new CeloProvider(existingProvider, web3ContractsCache, privateKey)
    web3.setProvider(celoProvider)
    celoProvider.start()
  }
  debug('Providers configured')
  return web3
}
