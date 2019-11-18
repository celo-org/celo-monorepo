// import fs from 'fs'
// import { getBlockscoutClusterInternalUrl } from 'src/lib/endpoints'
import { AccountType, generateAddress, generatePrivateKey } from 'src/lib/generate_utils'
// import { checkGethStarted, getWeb3AndTokensContracts, simulateClient, sleep } from 'src/lib/geth'
import { simulateClient } from 'src/lib/geth'
import * as yargs from 'yargs'
// import { GethArgv } from '../geth'

export const command = 'simulate-client'

export const describe = 'command for simulating client behavior'

// const TRANSACTION_RECIPIENT = '0x4da58d267cd465b9313fdb19b120ec591d957ad2'

interface SimulateClientArgv extends yargs.Argv {
  blockscoutMeasurePercent: number
  blockscoutUrl: string
  delay: number
  gasFeeRecipientIndex: number
  index: number
  mnemonic: string
  recipientIndex: number
}

export const builder = () => {
  return yargs
    .option('blockscout-measure-percent', {
      type: 'number',
      description:
        'Percent of transactions to measure blockscout time. Must be in the range of [0, 100]',
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
      description: 'Index of load test account to send transactions from',
      default: 0,
    })
    .option('recipient-index', {
      type: 'number',
      description: 'Index of the load test account to send transactions to',
      default: 0,
    })
    .option('gas-fee-recipient-index', {
      type: 'number',
      description: 'Index of the load test account to send gas fees to',
      default: 0,
    })
    .options('mnemonic', {
      type: 'string',
      description: 'Mnemonic used to generate account addresses',
      demand: 'A mnemonic must be provided',
    })
}

export const handler = async (argv: SimulateClientArgv) => {
  // send transactions to another load testing account
  const senderPrivateKey = generatePrivateKey(
    argv.mnemonic,
    AccountType.LOAD_TESTING_ACCOUNT,
    argv.index
  )
  const recipientAddress = generateAddress(
    argv.mnemonic,
    AccountType.LOAD_TESTING_ACCOUNT,
    argv.recipientIndex
  )
  const gasFeeRecipientAddress = generateAddress(
    argv.mnemonic,
    AccountType.LOAD_TESTING_ACCOUNT,
    argv.gasFeeRecipientIndex
  )

  await simulateClient(
    senderPrivateKey,
    recipientAddress,
    gasFeeRecipientAddress,
    argv.delay,
    argv.blockscoutUrl,
    argv.blockscoutMeasurePercent,
    argv.index
  )
}
