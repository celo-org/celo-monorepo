import {
  CeloContract,
  CeloFunctionCall,
  constructFunctionABICache,
  Contracts,
  FunctionABICache,
  getContracts,
  getFunctionSignatureFromInput,
  parseFunctionCall,
  parseLog,
} from '@celo/contractkit'
import { find } from 'lodash'
import {
  blockheaderCounter,
  parsedTransactionCounter,
  transactionCounter,
  transactionGasUsed,
  transactionLogsCounter,
  transactionParsedLogsCounter,
} from 'src/metrics'
import Web3 from 'web3'
import { Block, Transaction } from 'web3/eth/types'
import { Log, TransactionReceipt } from 'web3/types'

type Context = {
  contracts: Contracts
  functionABICache: FunctionABICache
  web3: Web3
}

const EMPTY_INPUT = 'empty_input'
const NO_METHOD_ID = 'no_method_id'
const NOT_WHITELISTED_ADDRESS = 'not_whitelisted_address'
const UNKNOWN_METHOD = 'unknown_method'

async function instrumentLog(
  log: Log,
  parsedTransaction: CeloFunctionCall,
  transactionContract: CeloContract,
  web3: Web3
) {
  const parsedLog = parseLog(parsedTransaction, log, transactionContract, web3)

  if (parsedLog === null) {
    return
  }

  transactionParsedLogsCounter.inc({
    contract: parsedTransaction.contractName,
    function: parsedTransaction.functionName,
    log: parsedLog.logName,
  })

  console.info(
    JSON.stringify({
      event: 'RECEIVED_PARSED_LOG',
      ...parsedLog,
    })
  )
}

async function instrumentTransaction(transactionHash: string, context: Context) {
  const transaction = await context.web3.eth.getTransaction(transactionHash)
  const receipt = await context.web3.eth.getTransactionReceipt(transactionHash)
  console.log(JSON.stringify({ event: 'RECEIVED_TRANSACTION', ...transaction }))
  console.log(JSON.stringify({ event: 'RECEIVED_TRANSACTION_RECEIPT', ...receipt }))

  const metricLabels = getTransactionLabels(transaction, receipt, context)
  transactionCounter.inc(metricLabels)
  transactionGasUsed.observe(metricLabels, receipt.gasUsed)
  transactionLogsCounter.inc(metricLabels, receipt.logs.length)

  const [parsedTransaction, transactionContract] = parseFunctionCall(
    transaction,
    context.functionABICache,
    context.web3
  )

  if (parsedTransaction === null) {
    return
  }

  parsedTransactionCounter.inc({
    contract: parsedTransaction.contractName,
    function: parsedTransaction.functionName,
  })

  console.info(
    JSON.stringify({
      event: 'RECEIVED_PARSED_TRANSACTION',
      ...parsedTransaction,
    })
  )

  receipt.logs &&
    receipt.logs.forEach((log) => {
      instrumentLog(log, parsedTransaction, transactionContract, context.web3)
    })
}

async function instrumentTransactions(blockHash: string, context: Context) {
  // @ts-ignore Types are wrong about using the hash to get block
  const block: Block = await context.web3.eth.getBlock(blockHash)
  const previousBlock: Block = await context.web3.eth.getBlock(block.number - 1)
  const blockTime = block.timestamp - previousBlock.timestamp
  console.log(JSON.stringify({ event: 'RECEIVED_BLOCK', ...block, blockTime }))

  block.transactions.forEach(async function(transactionHash) {
    // @ts-ignore Wrong type
    instrumentTransaction(transactionHash, context)
  })
}

function contractForTransaction(transaction: Transaction, context: Context) {
  return find(context.contracts, (contract) => contract.options.address == transaction.to)
}

function whitelistAddress(transaction: Transaction, context: Context) {
  return contractForTransaction(transaction, context) ? transaction.to : NOT_WHITELISTED_ADDRESS
}

function getTransactionLabels(
  transaction: Transaction,
  receipt: TransactionReceipt,
  context: Context
) {
  return {
    to: whitelistAddress(transaction, context),
    methodId: getMethodId(transaction, context),
    status: receipt.status.toString(),
  }
}

function getMethodId(transaction: Transaction, context: Context) {
  if (transaction.input === '0x') {
    return EMPTY_INPUT
  }
  if (transaction.input.startsWith('0x')) {
    const method = getFunctionSignatureFromInput(transaction, context.functionABICache)
    return method ? transaction.input.substring(0, 10) : UNKNOWN_METHOD
  }
  // pretty much should never get here
  return NO_METHOD_ID
}

export async function getContext(web3: Web3): Promise<Context> {
  const contracts = await getContracts(web3)
  return {
    contracts,
    web3,
    functionABICache: constructFunctionABICache(Object.values(contracts), web3),
  }
}

export async function pollBlockchain(provider: string) {
  const web3: Web3 = new Web3(provider)
  const context = await getContext(web3)
  const web3Provider = web3.currentProvider

  // @ts-ignore
  web3Provider.on('error', function(error: any) {
    console.error('Error from web3 provider')
    console.error(error)
    process.exit(1)
  })

  // @ts-ignore
  web3Provider.on('close', function(error: any) {
    console.error('Connection from web3 provider closed')
    console.error(error)
    process.exit(1)
  })

  async function reconnect(retries: number) {
    console.log(`Retry with ${retries} left`)
    if (retries <= 0) {
      console.error('Reconnection attempts failed, exiting')
      process.exit(1)
    }

    // @ts-ignore
    web3.setProvider(provider)
    try {
      await web3.eth.net.isListening()
      console.info('Reconnection successful')
      pollBlockchain(provider)
    } catch (error) {
      setTimeout(reconnect.bind(this, retries - 1), 5000)
    }
  }

  async function pollConnectionStatus() {
    try {
      await web3.eth.net.isListening()
      setTimeout(pollConnectionStatus, 10000)
    } catch (error) {
      console.error('Web3 reported disconnection')
      setTimeout(reconnect.bind(this, 10), 5000)
    }
  }

  pollConnectionStatus()

  const subscription = await web3.eth.subscribe('newBlockHeaders')
  subscription.on('data', function(header: Block) {
    console.log(JSON.stringify({ event: 'RECEIVED_BLOCK_HEADER', ...header }))
    blockheaderCounter.inc({ miner: header.miner })
    instrumentTransactions(header.hash, context)
  })
  subscription.on('error', function(error: any) {
    console.error('Error occurred during listening')
    console.error(error)
    process.exit(1)
  })
}
