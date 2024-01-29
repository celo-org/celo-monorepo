/* tslint:disable no-console */
import BigNumber from 'bignumber.js'
import { AccountType, generateAddress, generatePrivateKey } from 'src/lib/generate_utils'
import {
  MAX_LOADTEST_THREAD_COUNT,
  TestMode,
  getIndexForLoadTestThread,
  simulateClient,
} from 'src/lib/geth'
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
  contractAddress: string
  contractData: string
  clientCount: number
  reuseClient: boolean
  maxGasPrice: number
  totalTxGas: number
  testMode: string
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
    .options('contract-address', {
      type: 'string',
      description: `Contract Address to send to when using test mode: ${TestMode.ContractCall}`,
      default: '',
    })
    .options('contract-data', {
      type: 'string',
      description: `Data to send to when using test mode: ${TestMode.ContractCall}`,
      default: '',
    })
    .options('mnemonic', {
      type: 'string',
      description: 'Mnemonic used to generate account addresses',
      demand: 'A mnemonic must be provided',
    })
    .options('client-count', {
      type: 'number',
      description: `Number of clients to simulate, must not exceed ${MAX_LOADTEST_THREAD_COUNT}`,
      default: 1,
    })
    .check((argv) => argv['client-count'] <= MAX_LOADTEST_THREAD_COUNT)
    .options('reuse-client', {
      type: 'boolean',
      description: 'Use the same client for all the threads/accounts',
      default: false,
    })
    .options('max-gas-price', {
      type: 'number',
      description: 'Max gasPrice to use for transactions',
      default: 0,
    })
    .options('total-tx-gas', {
      type: 'number',
      description: 'Gas Target when using data transfers',
      default: 500000,
    })
    .options('test-mode', {
      type: 'string',
      description:
        'Load test mode: mixed transaction types, big calldatas, simple transfers paid in CELO, transfers paid in cUSD, or contract calls',
      choices: [
        TestMode.Mixed,
        TestMode.Data,
        TestMode.Transfer,
        TestMode.StableTransfer,
        TestMode.ContractCall,
      ],
      default: TestMode.Mixed,
    })
}

export const handler = async (argv: SimulateClientArgv) => {
  for (let thread = 0; thread < argv.clientCount; thread++) {
    const senderIndex = getIndexForLoadTestThread(argv.index, thread)
    const recipientIndex = getIndexForLoadTestThread(argv.recipientIndex, thread)
    const senderPK = generatePrivateKey(
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

    console.info(
      `PK for sender index ${argv.index} thread ${thread}, final index ${senderIndex}: ${senderPK}`
    )
    console.info(
      `Account for recipient index ${argv.recipientIndex} thread ${thread}, final index ${recipientIndex}: ${recipientAddress}`
    )
    console.info(`web3ProviderPort for thread ${thread}: ${web3ProviderPort}`)

    await simulateClient(
      senderPK,
      recipientAddress,
      argv.contractAddress,
      argv.contractData,
      argv.delay,
      argv.blockscoutUrl,
      argv.blockscoutMeasurePercent,
      argv.index,
      argv.testMode as TestMode,
      thread,
      new BigNumber(argv.maxGasPrice),
      argv.totalTxGas,
      `http://127.0.0.1:${web3ProviderPort}`
    )
  }
}
