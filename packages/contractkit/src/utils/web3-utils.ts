import debugFactory from 'debug'
import Web3 from 'web3'
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

// Returns contract events from the last N epochs.
export async function getEpochEvents(
  web3: Web3,
  contract: any,
  eventName: string,
  epochSize: number,
  epochs = 1
) {
  const currentBlock = await web3.eth.getBlockNumber()
  const lastEpochBlock = Math.floor(currentBlock / epochSize) * epochSize
  const fromBlock: number = lastEpochBlock - (epochSize - 1) * epochs
  // Better to call contract.getPastEvents() N times with fromBlock == toBlock?
  return await contract.getPastEvents(eventName, { fromBlock, toBlock: lastEpochBlock })
}
