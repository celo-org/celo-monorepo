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
  return [].concat.apply(
    [],
    await forEachEpochAsync(
      web3,
      (blockNumber: number) =>
        contract.getPastEvents(eventName, { fromBlock: blockNumber, toBlock: blockNumber }),
      epochSize,
      epochs
    )
  )
}

// Waits on callback(blockNumber) for the last N epochs.
export async function forEachEpochAsync(web3: Web3, callback: any, epochSize: number, epochs = 1) {
  const currentBlock = await web3.eth.getBlockNumber()
  const lastEpochBlock = Math.floor(currentBlock / epochSize) * epochSize
  const fromBlock: number = lastEpochBlock - epochSize * (epochs - 1)
  var results = []
  for (var blockNumber = fromBlock; blockNumber <= lastEpochBlock; blockNumber += epochSize)
    results.push(callback(blockNumber))
  return await Promise.all(results)
}

// Waits on callback(blockNumber) for the last N epochs.
export async function mapEachEpochAsync(web3: Web3, callback: any, epochSize: number, epochs = 1) {
  const currentBlock = await web3.eth.getBlockNumber()
  const lastEpochBlock = Math.floor(currentBlock / epochSize) * epochSize
  const fromBlock: number = lastEpochBlock - epochSize * (epochs - 1)
  var promises = []
  for (var blockNumber = fromBlock; blockNumber <= lastEpochBlock; blockNumber += epochSize)
    promises.push(callback(blockNumber))
  const results = await Promise.all(promises)

  var index = 0
  const dict: { [key: number]: any } = {}
  for (var blockNumber = fromBlock; blockNumber <= lastEpochBlock; blockNumber += epochSize)
    dict[blockNumber] = results[index++]
  return dict
}
