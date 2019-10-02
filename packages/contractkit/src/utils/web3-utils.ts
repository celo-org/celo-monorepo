import debugFactory from 'debug'
import Web3 from 'web3'
import { GasPriceMinimum } from '../generated/types/GasPriceMinimum'
import { CeloProvider } from '../providers/celo-provider'

const debug = debugFactory('kit:web3:utils')

// Return the modified web3 object for chaining
export function addLocalAccount(
  web3: Web3,
  privateKey: string,
  gasPriceMinimum?: Promise<GasPriceMinimum>
): Web3 {
  const existingProvider = web3.currentProvider
  if (existingProvider instanceof CeloProvider) {
    const celoProvider = existingProvider as CeloProvider
    celoProvider.addAccount(privateKey)
  } else {
    const celoProvider = new CeloProvider(existingProvider, privateKey, gasPriceMinimum)
    web3.setProvider(celoProvider)
    celoProvider.start()
  }
  debug('Providers configured')
  return web3
}
