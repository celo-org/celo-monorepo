/* tslint:disable no-console */
import { AccountType, generateAddress } from 'src/lib/generate_utils'
import { getIndexForLoadTestThread, simulateClient } from 'src/lib/geth'
import * as yargs from 'yargs'
export const command = 'simulate-client'

export const describe = 'command for simulating client behavior'

interface SimulateClientArgv extends yargs.Argv {
  blockscoutMeasurePercent: number
  blockscoutUrl: string
  delay: number
  index: number
  mnemonic: string
  recipientIndex: number
  clientCount: number
  reuseClient: boolean
}

export const builder = () => {
  return yargs
    .option('blockscout-measure-percent', {
      type: 'number',
      description:
        'Percent of transactions to measure the time it takes for blockscout to process a transaction. Should be in the range of [0, 100]',
      default: 100,
    })
    .option('blockscout-url', {
      type: 'string',
      description:
        'URL of blockscout used for measuring the time for transactions to be indexed by blockscout',
    })
    .option('delay', {
      type: 'number',
      description: 'Delay between sending transactions in milliseconds',
      default: 10000,
    })
    .option('index', {
      type: 'number',
      description:
        'Index of the load test account to send transactions from. Used to generate account address',
    })
    .option('recipient-index', {
      type: 'number',
      description:
        'Index of the load test account to send transactions to. Used to generate account address',
      default: 0,
    })
    .options('mnemonic', {
      type: 'string',
      description: 'Mnemonic used to generate account addresses',
      demand: 'A mnemonic must be provided',
    })
    .options('client-count', {
      type: 'number',
      description: 'Number of clients to simulate',
      default: 1,
    })
    .options('reuse-client', {
      type: 'boolean',
      description: 'Use the same client for all the threads/accounts',
      default: false,
    })
}

export const handler = async (argv: SimulateClientArgv) => {
  for (let thread = 0; thread < argv.clientCount; thread++) {
    const senderIndex = getIndexForLoadTestThread(argv.index, thread)
    const recipientIndex = getIndexForLoadTestThread(argv.recipientIndex, thread)
    const senderAddress = generateAddress(
      argv.mnemonic,
      AccountType.LOAD_TESTING_ACCOUNT,
      senderIndex
    )
    const recipientAddress = generateAddress(
      argv.mnemonic,
      AccountType.LOAD_TESTING_ACCOUNT,
      recipientIndex
    )

    const web3ProviderPort = argv.reuseClient ? 8545 : 8545 + thread

    console.log(
      `Account for sender index ${argv.index} thread ${thread}, final index ${senderIndex}: ${senderAddress}`
    )
    console.log(
      `Account for recipient index ${argv.recipientIndex} thread ${thread}, final index ${recipientIndex}: ${recipientAddress}`
    )
    console.log(`web3ProviderPort for thread ${thread}: ${web3ProviderPort}`)

    // tslint:disable-next-line: no-floating-promises
    simulateClient(
      senderAddress,
      recipientAddress,
      argv.delay,
      argv.blockscoutUrl,
      argv.blockscoutMeasurePercent,
      argv.index,
      thread,
      `http://localhost:${web3ProviderPort}`
    )
  }
}
