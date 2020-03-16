import { CeloContract, ContractKit, newKit } from '@celo/contractkit'
import {
  newBlockExplorer,
  ParsedBlock,
  ParsedTx,
} from '@celo/contractkit/lib/explorer/block-explorer'
import { newLogExplorer } from '@celo/contractkit/lib/explorer/log-explorer'
import { Future } from '@celo/utils/lib/future'
import { consoleLogger } from '@celo/utils/lib/logger'
import { conditionWatcher, tryObtainValueWithRetries } from '@celo/utils/lib/task'
import { Transaction, WebsocketProvider } from 'web3-core'
import { Block, BlockHeader } from 'web3-eth'
import { Counters } from './metrics'
import { ViewDefinition } from './view-definition'
import { labelValues } from 'prom-client'

const EMPTY_INPUT = 'empty_input'
const NO_METHOD_ID = 'no_method_id'
const NOT_WHITELISTED_ADDRESS = 'not_whitelisted_address'
const UNKNOWN_METHOD = 'unknown_method'
let BLOCK_INTERVAL = 1

export async function metricExporterWithRestart(providerUrl: string, blockInterval: number) {
  try {
    BLOCK_INTERVAL = blockInterval
    console.log('MetricExporter: Start')
    console.log('ProviderUrl: ' + providerUrl)
    console.log('Block Interval: ' + BLOCK_INTERVAL)

    let kit = newKit(providerUrl)
    while (true) {
      console.log('MetricExporter: Run Start')
      const reason = await runMetricExporter(kit)

      if (reason.reason === 'not-listening') {
        console.error('MetricExporter: Web3 Not listening... retrying')
        const maybeKit = await newListeningKit(providerUrl)
        if (maybeKit != null) {
          kit = maybeKit
        } else {
          console.error('MetricExporter: Retry failed. Exiting')
        }
      } else {
        console.error('MetricExporter: Error %s', reason.reason)
        console.error(reason.error)
        process.exit(1)
      }
    }
  } catch (err) {
    console.error('MetricExporter: Unexpected error %s', err.message)
    console.error(err)
    process.exit(1)
  }
}

type EndReason =
  | { reason: 'connection-error'; error: any }
  | { reason: 'subscription-error'; error: any }
  | { reason: 'not-listening' }

export async function runMetricExporter(kit: ContractKit): Promise<EndReason> {
  const blockProcessor = await newBlockHeaderProcessor(kit)
  const provider = kit.web3.currentProvider as WebsocketProvider
  const subscription = await kit.web3.eth.subscribe('newBlockHeaders')
  subscription.on('data', blockProcessor)

  const listeningWatcher = conditionWatcher({
    name: 'check:kit:isListening',
    logger: consoleLogger,
    timeInBetweenMS: 5000,
    initialDelayMS: 5000,
    pollCondition: async () => {
      try {
        return !(await kit.isListening())
      } catch (error) {
        console.error(error)
        return true
      }
    },
    onSuccess: () => endExporter({ reason: 'not-listening' }),
  })

  provider.on('error', ((error: any) => endExporter({ reason: 'connection-error', error })) as any)
  subscription.on('error', (error: any) => endExporter({ reason: 'subscription-error', error }))

  // Future that is resolved on error (see dispose)
  const endReason = new Future<EndReason>()
  const endExporter = (reason: EndReason) => {
    listeningWatcher.stop()
    ;(subscription as any).unsubscribe()
    provider.removeAllListeners('error')
    ;(provider as any).disconnect()
    endReason.resolve(reason)
  }

  return endReason.asPromise()
}

async function newListeningKit(providerUrl: string): Promise<null | ContractKit> {
  try {
    return tryObtainValueWithRetries({
      name: 'createValidKit',
      logger: consoleLogger,
      maxAttemps: 10,
      timeInBetweenMS: 5000,
      tryGetValue: () => {
        const kit = newKit(providerUrl)
        return kit.isListening().then((isOk) => (isOk ? kit : null))
      },
    }).onValue()
  } catch {
    return null
  }
}

const logEvent = (name: string, details: object) =>
  console.log(JSON.stringify({ event: name, ...details }))

async function newBlockHeaderProcessor(kit: ContractKit): Promise<(block: BlockHeader) => void> {
  const blockExplorer = await newBlockExplorer(kit)
  const logExplorer = await newLogExplorer(kit)

  const exchange = await kit.contracts.getExchange()
  const sortedOracles = await kit.contracts.getSortedOracles()
  // const reserve = await kit.contracts.getReserve()
  const goldToken = await kit.contracts.getGoldToken()
  // const epochRewards = await kit.contracts.getEpochRewards()

  enum LoggingCategory {
    Block = 'RECEIVED_BLOCK',
    ParsedLog = 'RECEIVED_PARSED_LOG',
    ParsedTransaction = 'RECEIVED_PARSED_TRANSACTION',
    State = 'RECEIVED_STATE',
    Transaction = 'RECEIVED_TRANSACTION',
    TransactionReceipt = 'RECEIVED_TRANSACTION_RECEIPT',
  }

  function toMethodId(txInput: string, isKnownCall: boolean): string {
    let methodId: string
    if (txInput === '0x') {
      methodId = EMPTY_INPUT
    } else if (txInput.startsWith('0x')) {
      methodId = isKnownCall ? txInput.slice(0, 10) : UNKNOWN_METHOD
    } else {
      // pretty much should never get here
      methodId = NO_METHOD_ID
    }
    return methodId
  }

  function toTxMap(parsedBlock: ParsedBlock): Map<string, ParsedTx> {
    const parsedTxMap: Map<string, ParsedTx> = new Map()
    parsedBlock.parsedTx.forEach((ptx) => {
      parsedTxMap.set(ptx.tx.hash, ptx)
    })
    return parsedTxMap
  }

  async function fetchState(blockNumber: number) {
    // Fetching public state
    // Stability
    exchange
      .getBuyAndSellBuckets(true)
      .then((buckets) => {
        const view: ViewDefinition = {
          contract: 'Exchange',
          function: 'getBuyAndSellBuckets',
          currentStableBucket: Number(buckets[0]),
          currentGoldBucket: Number(buckets[1]),
          blockNumber: blockNumber,
        }
        logEvent(LoggingCategory.State, view)
      })
      .catch()

    sortedOracles
      .medianRate(CeloContract.StableToken)
      .then((medianRate) => {
        const view: ViewDefinition = {
          contract: 'SortedOracles',
          function: 'medianRate',
          medianRate: Number(medianRate.rate),
          blockNumber: blockNumber,
        }
        logEvent(LoggingCategory.State, view)
      })
      .catch()

    // TODO: Pending of implement getReserveGoldBalance function in contractKit
    // reserve
    //   .getReserveGoldBalance()
    //   .then((goldBalance) => {
    //     const view: ViewDefinition = {
    //       contract: 'Reserve',
    //       function: 'getReserveGoldBalance',
    //       goldBalance: Number(goldBalance),
    //     }
    //     logEvent(LoggingCategory.State, view)
    //   })
    //   .catch()

    // PoS
    goldToken
      .totalSupply()
      .then((goldTokenTotalSupply) => {
        const view: ViewDefinition = {
          contract: 'GoldToken',
          function: 'totalSupply',
          goldTokenTotalSupply: Number(goldTokenTotalSupply),
          blockNumber: blockNumber,
        }
        logEvent(LoggingCategory.State, view)
      })
      .catch()

    // TODO: Pending EpochRewards wrapper implementation
    // epochRewards.getTargetGoldTotalSupply()
    //   .then(rewardsAmount => {
    //     const view: ViewDefinition = {
    //       contract: "EpochRewards",
    //       function: "getTargetGoldTotalSupply",
    //       rewardsAmount: Number(rewardsAmount)
    //     }
    //     logEvent(LoggingCategory.State, view)
    //   })
    //   .catch()

    // epochRewards.getRewardsMultiplier()
    //   .then(rewardsMultiplier => {
    //     const view: ViewDefinition = {
    //       contract: "EpochRewards",
    //       function: "getRewardsMultiplier",
    //       rewardsMultiplier: Number(rewardsMultiplier)
    //     }
    //     logEvent(LoggingCategory.State, view)
    //   })
    //   .catch()
  }

  return async (header: BlockHeader) => {
    Counters.blockheader.inc({ miner: header.miner })

    const block = await blockExplorer.fetchBlock(header.number)
    const previousBlock: Block = await blockExplorer.fetchBlock(header.number - 1)

    const blockTime = Number(block.timestamp) - Number(previousBlock.timestamp)
    logEvent(LoggingCategory.Block, { ...block, blockTime })

    const parsedBlock = blockExplorer.parseBlock(block)
    const parsedTxMap = toTxMap(parsedBlock)

    if (header.number % BLOCK_INTERVAL === 0) {
      // tslint:disable-next-line: no-floating-promises
      fetchState(header.number)
    }

    for (const tx of parsedBlock.block.transactions as Transaction[]) {
      const parsedTx: ParsedTx | undefined = parsedTxMap.get(tx.hash)

      logEvent(LoggingCategory.Transaction, tx)
      const receipt = await kit.web3.eth.getTransactionReceipt(tx.hash)
      logEvent(LoggingCategory.TransactionReceipt, receipt)

      const labels = {
        to: parsedTx ? tx.to : NOT_WHITELISTED_ADDRESS,
        methodId: toMethodId(tx.input, parsedTx != null),
        status: receipt.status.toString(),
      } as labelValues

      Counters.transaction.inc(labels)
      Counters.transactionGasUsed.observe(labels, receipt.gasUsed)
      Counters.transactionLogs.inc(labels, (receipt.logs || []).length)

      if (parsedTx) {
        Counters.parsedTransaction.inc({
          contract: parsedTx.callDetails.contract,
          function: parsedTx.callDetails.function,
        })

        logEvent(LoggingCategory.ParsedTransaction, { ...parsedTx.callDetails, hash: tx.hash })

        for (const event of logExplorer.getKnownLogs(receipt)) {
          Counters.transactionParsedLogs.inc({
            contract: parsedTx.callDetails.contract,
            function: parsedTx.callDetails.function,
            log: event.event,
          })

          // @ts-ignore We want to rename event => eventName to avoid overwriting
          event.eventName = event.event
          delete event.event

          logEvent(LoggingCategory.ParsedLog, event)
        }
      }
    }
  }
}
