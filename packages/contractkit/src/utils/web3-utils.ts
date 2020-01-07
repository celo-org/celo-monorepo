import debugFactory from 'debug'
import Web3 from 'web3'
import { ABIDefinition } from 'web3/eth/abi'
import { CeloProvider } from '../providers/celo-provider'

const debug = debugFactory('kit:web3:utils')

// Return the modified web3 object for chaining
export function addLocalAccount(web3: Web3, privateKey: string): Web3 {
  const existingProvider = web3.currentProvider
  if (existingProvider instanceof CeloProvider) {
    const celoProvider = existingProvider as CeloProvider
    celoProvider.addAccount(privateKey)
  } else {
    const celoProvider = new CeloProvider(existingProvider, privateKey)
    web3.setProvider(celoProvider)
    celoProvider.start()
  }
  debug('Providers configured')
  return web3
}

export const getAbiTypes = (abi: ABIDefinition[], methodName: string) =>
  abi.find((entry) => entry.name! === methodName)!.inputs!.map((input) => input.type)
