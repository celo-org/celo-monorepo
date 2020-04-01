import { ContractKit } from '@celo/contractkit'
import { newBlockExplorer, ParsedTx } from '@celo/contractkit/lib/explorer/block-explorer'
import { newLogExplorer } from '@celo/contractkit/lib/explorer/log-explorer'
import { labelValues, Histogram, linearBuckets } from 'prom-client'
import { Transaction } from 'web3-core'
import { Block } from 'web3-eth'

import { Counters } from './metrics'
import { Contracts, stateGetters } from './states'
import { toMethodId, toTxMap } from './utils'

import { tracerAsText } from './tracer'

enum LoggingCategory {
  Block = 'RECEIVED_BLOCK',
  ParsedLog = 'RECEIVED_PARSED_LOG',
  ParsedTransaction = 'RECEIVED_PARSED_TRANSACTION',
  State = 'RECEIVED_STATE',
  Transaction = 'RECEIVED_TRANSACTION',
  TransactionReceipt = 'RECEIVED_TRANSACTION_RECEIPT',
  InternalTransaction = 'INTERNAL_TRANSACTION',
}

interface DataResult {
  contract: string
  function: string
  args: any
  blockNumber: number
  values: { [metric: string]: number }
}

export class BlockProcessor {
  private contracts: Contracts = {} as any
  private initialized = false
  private histograms: { [key: string]: Histogram } = {}

  constructor(
    private kit: ContractKit,
    private blockInterval = 1,
    private fromBlock: number = 0,
    private toBlock: number = fromBlock
  ) {}

  async init() {
    if (this.initialized) {
      throw new Error('BlockProcessor is running')
    }
    this.initialized = true

    await this.loadContracts()

    if (this.fromBlock?.toFixed?.() && this.toBlock) {
      this.initBatch()
    } else {
      await this.initSubscription()
    }
  }

  async loadContracts() {
    this.contracts.Exchange = await this.kit.contracts.getExchange()
    this.contracts.SortedOracles = await this.kit.contracts.getSortedOracles()
    this.contracts.Reserve = await this.kit.contracts.getReserve()
    this.contracts.GoldToken = await this.kit.contracts.getGoldToken()
    this.contracts.EpochRewards = await this.kit.contracts.getEpochRewards()
    this.contracts.StableToken = await this.kit.contracts.getStableToken()
  }

  async initSubscription() {
    const subscription = await this.kit.web3.eth.subscribe('newBlockHeaders')

    // Prevent same block multiples times
    let lastBlocks: number[] = []
    subscription.on('data', (header) => {
      if (!lastBlocks.includes(header.number)) {
        // tslint:disable-next-line: no-floating-promises
        this.onNewBlock(header.number)
      }
      lastBlocks.push(header.number)
      lastBlocks = lastBlocks.slice(-10)
    })
  }

  async initBatch() {
    let block = this.fromBlock - 1
    while (++block <= this.toBlock) {
      await this.onNewBlock(block, block - this.fromBlock)
    }
  }

  async onNewBlock(blockNumber: number, blockIntervalNumber?: number) {
    if ((blockIntervalNumber ?? blockNumber) % this.blockInterval === 0) {
      await Promise.all([this.fetchBlockState(blockNumber), this.processBlockHeader(blockNumber)])
    }
  }

  async fetchBlockState(blockNumber: number) {
    const promises = stateGetters.map(
      async ({ contract, method, args, transformValues, maxBucketSize }) => {
        if (!(await this.contracts[contract].exists(blockNumber))) {
          return
        }
        args = typeof args === 'function' ? args(blockNumber) : args
        this.contracts[contract].setDefaultBlock(blockNumber)
        return (this.contracts as any)[contract][method](...args)
          .then((returnData: any) => {
            this.contracts[contract].setDefaultBlock('latest')
            const data: DataResult = {
              contract,
              function: method,
              args: JSON.stringify(args),
              blockNumber,
              values: transformValues(returnData),
            }
            this.logEvent(LoggingCategory.State, data)
            this.logHistogram({ ...data, args }, maxBucketSize)
          })
          .catch(() => '') as Promise<any>
      }
    )
    await Promise.all(promises)
  }

  async processBlockHeader(blockNumber: number) {
    const NOT_WHITELISTED_ADDRESS = 'not_whitelisted_address'

    const blockExplorer = await newBlockExplorer(this.kit)
    const logExplorer = await newLogExplorer(this.kit)

    const block = await blockExplorer.fetchBlock(blockNumber)
    const previousBlock: Block = await blockExplorer.fetchBlock(blockNumber - 1)

    Counters.blockheader.inc({ miner: block.miner })

    const blockTime = Number(block.timestamp) - Number(previousBlock.timestamp)
    this.logEvent(LoggingCategory.Block, { ...block, blockTime })

    const parsedBlock = blockExplorer.parseBlock(block)
    const parsedTxMap = toTxMap(parsedBlock)

    for (const tx of parsedBlock.block.transactions as Transaction[]) {
      const parsedTx: ParsedTx | undefined = parsedTxMap.get(tx.hash)

      this.logEvent(LoggingCategory.Transaction, tx)
      const receipt = await this.kit.web3.eth.getTransactionReceipt(tx.hash)
      this.logEvent(LoggingCategory.TransactionReceipt, receipt)

      await new Promise((resolve) =>
        (this.kit.web3.currentProvider as any).existingProvider.send(
          {
            method: 'debug_traceTransaction',
            params: [
              tx.hash,
              {
                tracer: tracerAsText,
                disableStack: true,
                disableMemory: true,
                disableStorage: true,
              },
            ],
            jsonrpc: '2.0',
            id: '2',
          },
          (err: any, result: any) => {
            if (!err) {
              result?.result
                ?.filter?.(
                  ({ type, callType }: any) => type === 'create' || callType === 'delegatecall'
                )
                ?.forEach?.((data: any) =>
                  this.logEvent(LoggingCategory.InternalTransaction, {
                    ...data,
                    createdContractCode: undefined,
                    init: undefined,
                  })
                )
            }
            resolve()
          }
        )
      )
      // tslint:disable-next-line
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

        this.logEvent(LoggingCategory.ParsedTransaction, { ...parsedTx.callDetails, hash: tx.hash })
        try {
          for (const event of logExplorer.getKnownLogs(receipt)) {
            Counters.transactionParsedLogs.inc({
              contract: parsedTx.callDetails.contract,
              function: parsedTx.callDetails.function,
              log: event.event,
            })

            // @ts-ignore We want to rename event => eventName to avoid overwriting
            event.eventName = event.event
            delete event.event

            this.logEvent(LoggingCategory.ParsedLog, event)
          }
          // tslint:disable-next-line
        } catch {}
      }
    }
  }

  private logEvent(name: string, details: object) {
    console.log(JSON.stringify({ event: name, ...details }))
  }

  private logHistogram(
    { contract, function: functionName, args, values }: DataResult,
    maxBucketSize: any
  ) {
    const argsKey = (typeof args === 'function' ? args('blockNumber' as any) : args).join('_')
    Object.keys(values).forEach((valueKey) => {
      const key = `state_metric_${contract}_${functionName}_${argsKey}_${valueKey}`

      if (!this.histograms[key]) {
        let buckets: number[] = [0]
        if (maxBucketSize[valueKey]) {
          buckets = linearBuckets(0, maxBucketSize[valueKey] / 10, 10)
        }
        this.histograms[key] = new Histogram({
          name: key,
          help: `Histogram generated of the contract ${contract}, using the method ${functionName} and logging the value ${valueKey}`,
          labelNames: ['contract', 'function', 'args'],
          buckets,
        })
      }

      this.histograms[key].observe(
        {
          contract,
          function: functionName,
          args: argsKey,
        },
        values[valueKey]
      )
    })
  }
}
