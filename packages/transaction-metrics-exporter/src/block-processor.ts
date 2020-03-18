import { ContractKit } from '@celo/contractkit'
import { newBlockExplorer, ParsedTx } from '@celo/contractkit/lib/explorer/block-explorer'
import { newLogExplorer } from '@celo/contractkit/lib/explorer/log-explorer'
import { labelValues } from 'prom-client'
import { Transaction } from 'web3-core'
import { Block, BlockHeader } from 'web3-eth'

import { Counters } from './metrics'
import { Contracts, stateGetters } from './states'
import { toMethodId, toTxMap } from './utils'

enum LoggingCategory {
  Block = 'RECEIVED_BLOCK',
  ParsedLog = 'RECEIVED_PARSED_LOG',
  ParsedTransaction = 'RECEIVED_PARSED_TRANSACTION',
  State = 'RECEIVED_STATE',
  Transaction = 'RECEIVED_TRANSACTION',
  TransactionReceipt = 'RECEIVED_TRANSACTION_RECEIPT',
}

export class BlockProcessor {
  private contracts: Contracts = {} as any
  private initialized = false

  constructor(private kit: ContractKit, private blockInterval = 1) {}

  async init() {
    if (this.initialized) {
      throw new Error('BlockProcessor is running')
    }

    await this.loadContracts()
    await this.initSubscription()
  }

  async loadContracts() {
    this.contracts.Exchange = await this.kit.contracts.getExchange()
    this.contracts.SortedOracles = await this.kit.contracts.getSortedOracles()
    // this.contracts.Reserve = await this.kit.contracts.getReserve()
    this.contracts.GoldToken = await this.kit.contracts.getGoldToken()
    this.contracts.EpochRewards = await this.kit.contracts.getEpochRewards()
  }

  async initSubscription() {
    const subscription = await this.kit.web3.eth.subscribe('newBlockHeaders')

    // Prevent same block multiples times
    let lastBlocks: number[] = []
    subscription.on('data', async (header) => {
      if (!lastBlocks.includes(header.number)) {
        await this.onNewBlock(header)
      }
      lastBlocks.push(header.number)
      lastBlocks = lastBlocks.slice(-10)
    })
  }

  async onNewBlock(header: BlockHeader) {
    if (header.number % this.blockInterval === 0) {
      // tslint:disable-next-line: no-floating-promises
      this.fetchBlockState(header.number)
      // tslint:disable-next-line: no-floating-promises
      this.processBlockHeader(header)
    }
  }

  fetchBlockState(blockNumber: number) {
    stateGetters.forEach(({ contract, method, params, transformValues }) => {
      ;(this.contracts as any)[contract][method](...params)
        .then((returnData: any) =>
          this.logEvent(LoggingCategory.State, {
            contract,
            function: method,
            params,
            blockNumber,
            values: transformValues(returnData),
          })
        )
        .catch()
    })
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
