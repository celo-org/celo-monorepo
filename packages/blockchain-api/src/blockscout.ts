import { RESTDataSource } from 'apollo-datasource-rest'
import {
  ABE_ADDRESS,
  BLOCKSCOUT_API,
  CONTRACT_SYMBOL_MAPPING,
  FAUCET_ADDRESS,
  VERIFICATION_REWARDS_ADDRESS,
} from './config'
import { EventArgs, EventInterface, EventTypes, TransferEvent } from './schema'
import { formatCommentString } from './utils'

// to get rid of 18 extra 0s in the values
const WEI_PER_GOLD = Math.pow(10, 18)

const MODULES = {
  // See https://blockscout.com/eth/mainnet/api_docs for API endpoints + param list
  ACCOUNT: 'account',
}

const MODULE_ACTIONS = {
  ACCOUNT: {
    BALANCE: 'balance',
    BALANCE_MULTI: 'balancemulti',
    TX_LIST: 'txlist',
    TX_LIST_INTERNAL: 'txlistinternal',
    TOKEN_TX: 'tokentx',
    TOKEN_BALANCE: 'tokenbalance',
  },
}

interface BlockscoutTransaction {
  value: number
  txreceipt_status: number
  transactionIndex: number
  to: string
  timeStamp: number
  nonce: number
  isError: number
  input: string
  hash: string
  gasUsed: number
  gasPrice: number
  gas: number
  from: string
  cumulativeGasUsed: number
  contractAddress: string
  confirmations: number
  blockNumber: number
  blockHash: string
}

export class BlockscoutAPI extends RESTDataSource {
  constructor() {
    super()
    this.baseURL = BLOCKSCOUT_API
  }

  async getTokenTransactions(args: EventArgs): Promise<BlockscoutTransaction[]> {
    console.info('Getting token transactions', args)
    const params = {
      ...args,
      module: MODULES.ACCOUNT,
      action: MODULE_ACTIONS.ACCOUNT.TOKEN_TX,
    }
    const { result } = await this.get('', params)
    return result
  }

  async getFeedEvents(args: EventArgs) {
    const rawTransactions = await this.getTokenTransactions(args)
    const events: EventInterface[] = []
    const userAddress = args.address.toLowerCase()

    // Mapping to figure out what event each raw transaction belongs to
    const txHashToEventTransactions = new Map<string, any>()
    for (const tx of rawTransactions) {
      const currentTX = txHashToEventTransactions.get(tx.hash) || []
      currentTX.push(tx)
      txHashToEventTransactions.set(tx.hash, currentTX)
    }

    // Generate final events
    txHashToEventTransactions.forEach((transactions: BlockscoutTransaction[], txhash: string) => {
      // Exchange events have two corresponding transactions (in and out)
      if (transactions.length === 2) {
        let inEvent: BlockscoutTransaction, outEvent: BlockscoutTransaction
        if (transactions[0].from.toLowerCase() === userAddress) {
          inEvent = transactions[0]
          outEvent = transactions[1]
        } else {
          inEvent = transactions[1]
          outEvent = transactions[0]
        }

        events.push({
          type: EventTypes.EXCHANGE,
          timestamp: inEvent.timeStamp,
          block: inEvent.blockNumber,
          inSymbol: CONTRACT_SYMBOL_MAPPING[inEvent.contractAddress.toLowerCase()],
          inValue: inEvent.value / WEI_PER_GOLD,
          outSymbol: CONTRACT_SYMBOL_MAPPING[outEvent.contractAddress.toLowerCase()],
          outValue: outEvent.value / WEI_PER_GOLD,
          hash: txhash,
        })

        // Otherwise, it's a regular token transfer
      } else {
        const event = transactions[0]
        const comment = event.input ? formatCommentString(event.input) : ''
        const eventToAddress = event.to.toLowerCase()
        const eventFromAddress = event.from.toLowerCase()
        const [type, address] = resolveTransferEventType(
          userAddress,
          eventToAddress,
          eventFromAddress
        )
        events.push({
          type,
          timestamp: event.timeStamp,
          block: event.blockNumber,
          value: event.value / WEI_PER_GOLD,
          address,
          comment,
          symbol: CONTRACT_SYMBOL_MAPPING[event.contractAddress.toLowerCase()] || 'unknown',
          hash: txhash,
        })
      }
    })

    console.info(
      `[Celo] getFeedEvents address=${args.address} startblock=${args.startblock} endblock=${
        args.endblock
      } rawTransactionCount=${rawTransactions.length} eventCount=${events.length}`
    )
    return events.sort((a, b) => b.timestamp - a.timestamp)
  }

  async getFeedRewards(args: EventArgs) {
    const rewards: TransferEvent[] = []
    const rawTransactions = await this.getTokenTransactions(args)
    for (const t of rawTransactions) {
      // Only include verification rewards transfers
      if (t.from.toLowerCase() !== VERIFICATION_REWARDS_ADDRESS) {
        continue
      }
      rewards.push({
        type: EventTypes.VERIFICATION_REWARD,
        timestamp: t.timeStamp,
        block: t.blockNumber,
        value: t.value / WEI_PER_GOLD,
        address: VERIFICATION_REWARDS_ADDRESS,
        comment: t.input ? formatCommentString(t.input) : '',
        symbol: CONTRACT_SYMBOL_MAPPING[t.contractAddress],
        hash: t.hash,
      })
    }
    console.info(
      `[Celo] getFeedRewards address=${args.address} startblock=${args.startblock} endblock=${
        args.endblock
      } rawTransactionCount=${rawTransactions.length} rewardsCount=${rewards.length}`
    )
    return rewards.sort((a, b) => b.timestamp - a.timestamp)
  }
}

function resolveTransferEventType(
  userAddress: string,
  eventToAddress: string,
  eventFromAddress: string
): [EventTypes, string] {
  if (eventToAddress === userAddress && eventFromAddress === FAUCET_ADDRESS) {
    return [EventTypes.FAUCET, FAUCET_ADDRESS]
  }
  if (eventToAddress === ABE_ADDRESS && eventFromAddress === userAddress) {
    return [EventTypes.VERIFICATION_FEE, ABE_ADDRESS]
  }
  if (eventToAddress === userAddress && eventFromAddress === VERIFICATION_REWARDS_ADDRESS) {
    return [EventTypes.VERIFICATION_REWARD, VERIFICATION_REWARDS_ADDRESS]
  }
  if (eventToAddress === userAddress) {
    return [EventTypes.RECEIVED, eventFromAddress]
  }
  if (eventFromAddress === userAddress) {
    return [EventTypes.SENT, eventToAddress]
  }
  throw new Error('No valid event type found ')
}
