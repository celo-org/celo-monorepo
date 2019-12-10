import sleep from 'sleep-promise'
import { AccountType, generateAddress } from 'src/lib/generate_utils'
import { simulateClient } from 'src/lib/geth'
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
      default: 0,
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
}

export const handler = async (argv: SimulateClientArgv) => {
  // So we can transactions to another load testing account
  const senderAddress = generateAddress(argv.mnemonic, AccountType.LOAD_TESTING_ACCOUNT, argv.index)
  const recipientAddress = generateAddress(
    argv.mnemonic,
    AccountType.LOAD_TESTING_ACCOUNT,
    argv.recipientIndex
  )

  // sleep a random amount of time in the range [0, argv.delay] before starting so
  // that if multiple simulations are started at the same time, they don't all
  // submit transactions at the same time
  const sleepMs = Math.random() * argv.delay
  console.info(`Sleeping for ${sleepMs} ms`)
  await sleep(sleepMs)

  await simulateClient(
    senderAddress,
    recipientAddress,
    argv.delay,
    argv.blockscoutUrl,
    argv.blockscoutMeasurePercent,
    argv.index
  )
}
