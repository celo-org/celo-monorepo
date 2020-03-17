import { Block, BlockHeader } from 'web3-eth'
import { Transaction } from 'web3-core'
import { ContractKit, CeloContract } from '@celo/contractkit'
import { newBlockExplorer, ParsedTx } from '@celo/contractkit/lib/explorer/block-explorer'
import { newLogExplorer } from '@celo/contractkit/lib/explorer/log-explorer'
import { labelValues } from 'prom-client'

import { toTxMap, toMethodId } from './utils'
import { Counters } from './metrics'
import { ViewDefinition } from './view-definition'

enum LoggingCategory {
  Block = 'RECEIVED_BLOCK',
  ParsedLog = 'RECEIVED_PARSED_LOG',
  ParsedTransaction = 'RECEIVED_PARSED_TRANSACTION',
  State = 'RECEIVED_STATE',
  Transaction = 'RECEIVED_TRANSACTION',
  TransactionReceipt = 'RECEIVED_TRANSACTION_RECEIPT',
}

type PromiseValue<T> = T extends PromiseLike<infer U> ? U : T
type ContractWrapperType<C extends any> = PromiseValue<ReturnType<ContractKit['contracts'][C]>>

export class BlockProcessor {
  private contracts: {
    exchange: ContractWrapperType<'getExchange'>
    sortedOracles: ContractWrapperType<'getSortedOracles'>
    reserve: ContractWrapperType<'getReserve'>
    goldToken: ContractWrapperType<'getGoldToken'>
    epochRewards: ContractWrapperType<'getEpochRewards'>
  } = {} as any
  private initialized = false

  constructor(private kit: ContractKit, private blockInterval = 1) {}

  async init() {
    if (this.initialized) {
      throw new Error('BlockProcessor is running')
    }

    await this.loadContracts()
    this.initSubscription()
  }

  async loadContracts() {
    // const blockExplorer = await newBlockExplorer(kit)
    // const logExplorer = await newLogExplorer(kit)

    this.contracts.exchange = await this.kit.contracts.getExchange()
    this.contracts.sortedOracles = await this.kit.contracts.getSortedOracles()
    // this.contracts.reserve = await this.kit.contracts.getReserve()
    this.contracts.goldToken = await this.kit.contracts.getGoldToken()
    this.contracts.epochRewards = await this.kit.contracts.getEpochRewards()
  }

  async initSubscription() {
    const subscription = await this.kit.web3.eth.subscribe('newBlockHeaders')

    // Prevent same block multiples times
    let lastBlocks: number[] = []
    subscription.on('data', (header) => {
      if (!lastBlocks.includes(header.number)) {
        this.onNewBlock(header)
      }
      lastBlocks.push(header.number)
      lastBlocks = lastBlocks.slice(-10)
    })
  }

  async onNewBlock(header: BlockHeader) {
    if (header.number % this.blockInterval === 0) {
      // tslint:disable-next-line: no-floating-promises
      this.fetchBlockState(header.number)
      this.processBlockHeader(header)
    }
  }

  fetchBlockState(blockNumber: number) {
    const { exchange, sortedOracles, /* reserve,*/ goldToken, epochRewards } = this.contracts
    // Stability
    exchange
      .getBuyAndSellBuckets(true)
      .then((buckets) => {
        const view: ViewDefinition = {
          contract: 'Exchange',
          function: 'getBuyAndSellBuckets',
          currentStableBucket: Number(buckets[0]),
          currentGoldBucket: Number(buckets[1]),
          blockNumber,
        }
        this.logEvent(LoggingCategory.State, view)
      })
      .catch()

    sortedOracles
      .medianRate(CeloContract.StableToken)
      .then((medianRate) => {
        const view: ViewDefinition = {
          contract: 'SortedOracles',
          function: 'medianRate',
          medianRate: Number(medianRate.rate),
          blockNumber,
        }
        this.logEvent(LoggingCategory.State, view)
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
    //     this.logEvent(LoggingCategory.State, view)
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
          blockNumber,
        }
        this.logEvent(LoggingCategory.State, view)
      })
      .catch()

    // TODO: Pending EpochRewards wrapper implementation
    epochRewards
      .getTargetGoldTotalSupply()
      .then((rewardsAmount) => {
        const view: ViewDefinition = {
          contract: 'EpochRewards',
          function: 'getTargetGoldTotalSupply',
          rewardsAmount: Number(rewardsAmount),
          blockNumber,
        }
        this.logEvent(LoggingCategory.State, view)
      })
      .catch()

    epochRewards
      .getRewardsMultiplier()
      .then((rewardsMultiplier) => {
        const view: ViewDefinition = {
          contract: 'EpochRewards',
          function: 'getRewardsMultiplier',
          rewardsMultiplier: Number(rewardsMultiplier),
          blockNumber,
        }
        this.logEvent(LoggingCategory.State, view)
      })
      .catch()
  }

  async processBlockHeader(header: BlockHeader) {
    const NOT_WHITELISTED_ADDRESS = 'not_whitelisted_address'

    const blockExplorer = await newBlockExplorer(this.kit)
    const logExplorer = await newLogExplorer(this.kit)

    Counters.blockheader.inc({ miner: header.miner })

    const block = await blockExplorer.fetchBlock(header.number)
    const previousBlock: Block = await blockExplorer.fetchBlock(header.number - 1)

    const blockTime = Number(block.timestamp) - Number(previousBlock.timestamp)
    this.logEvent(LoggingCategory.Block, { ...block, blockTime })

    const parsedBlock = blockExplorer.parseBlock(block)
    const parsedTxMap = toTxMap(parsedBlock)

    for (const tx of parsedBlock.block.transactions as Transaction[]) {
      const parsedTx: ParsedTx | undefined = parsedTxMap.get(tx.hash)

      this.logEvent(LoggingCategory.Transaction, tx)
      const receipt = await this.kit.web3.eth.getTransactionReceipt(tx.hash)
      this.logEvent(LoggingCategory.TransactionReceipt, receipt)

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
      }
    }
  }

  private logEvent(name: string, details: object) {
    console.log(JSON.stringify({ event: name, ...details }))
  }
}
