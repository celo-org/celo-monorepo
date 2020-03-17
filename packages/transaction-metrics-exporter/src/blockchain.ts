import { CeloContract, ContractKit, newKit } from '@celo/contractkit'
import {
  newBlockExplorer,
  ParsedBlock,
  ParsedTx,
} from '@celo/contractkit/lib/explorer/block-explorer'
import { newLogExplorer } from '@celo/contractkit/lib/explorer/log-explorer'
import { Future } from '@celo/utils/lib/future'
import { consoleLogger } from '@celo/utils/lib/logger'
import { labelValues } from 'prom-client'
import { conditionWatcher, tryObtainValueWithRetries } from '@celo/utils/lib/task'
import { Transaction, WebsocketProvider } from 'web3-core'
import { Block, BlockHeader } from 'web3-eth'
import { Counters } from './metrics'
import { ViewDefinition } from './view-definition'
import { BlockProcessor } from './block-processor'

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

interface EndReason {
  reason: 'connection-error' | 'subscription-error' | 'not-listening'
  error?: any
}

export async function runMetricExporter(kit: ContractKit): Promise<EndReason> {
  // Start exporting metrics
  new BlockProcessor(kit).init()

  const provider = kit.web3.currentProvider as WebsocketProvider
  const subscription = await kit.web3.eth.subscribe('newBlockHeaders')

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
