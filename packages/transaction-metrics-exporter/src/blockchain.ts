import { ContractKit, newKit } from '@celo/contractkit'
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
import { BlockHeader } from 'web3-eth'
import { Counters } from './metrics'

const EMPTY_INPUT = 'empty_input'
const NO_METHOD_ID = 'no_method_id'
const NOT_WHITELISTED_ADDRESS = 'not_whitelisted_address'
const UNKNOWN_METHOD = 'unknown_method'

export async function metricExporterWithRestart(providerUrl: string) {
  try {
    console.log('MetricExporter: Start')
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

  return async (header: BlockHeader) => {
    Counters.blockheader.inc({ miner: header.miner })

    const block = await blockExplorer.fetchBlock(header.number)
    const previousBlock = await blockExplorer.fetchBlock(header.number - 1)

    const blockTime = Number(block.timestamp) - Number(previousBlock.timestamp)
    logEvent('RECEIVED_BLOCK', { ...block, blockTime })

    const parsedBlock = blockExplorer.parseBlock(block)
    const parsedTxMap = toTxMap(parsedBlock)

    for (const tx of parsedBlock.block.transactions as Transaction[]) {
      const parsedTx: ParsedTx | undefined = parsedTxMap.get(tx.hash)

      logEvent('RECEIVED_TRANSACTION', tx)
      const receipt = await kit.web3.eth.getTransactionReceipt(tx.hash)
      logEvent('RECEIVED_TRANSACTION_RECEIPT', receipt)

      const labels = {
        to: parsedTx ? (tx.to as string) : NOT_WHITELISTED_ADDRESS,
        methodId: toMethodId(tx.input, parsedTx != null),
        status: receipt.status.toString(),
      }

      Counters.transaction.inc(labels)
      Counters.transactionGasUsed.observe(labels, receipt.gasUsed)
      Counters.transactionLogs.inc(labels, (receipt.logs || []).length)

      if (parsedTx) {
        Counters.parsedTransaction.inc({
          contract: parsedTx.callDetails.contract,
          function: parsedTx.callDetails.function,
        })

        logEvent('RECEIVED_PARSED_TRANSACTION', { ...parsedTx.callDetails, hash: tx.hash })

        for (const event of logExplorer.getKnownLogs(receipt)) {
          Counters.transactionParsedLogs.inc({
            contract: parsedTx.callDetails.contract,
            function: parsedTx.callDetails.function,
            log: event.event,
          })

          // @ts-ignore We want to rename event => eventName to avoid overwriting
          event.eventName = event.event
          delete event.event

          logEvent('RECEIVED_PARSED_LOG', event)
        }
      }
    }
  }
}
