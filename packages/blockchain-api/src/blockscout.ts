import { RESTDataSource } from 'apollo-datasource-rest'
import BigNumber from 'bignumber.js'
import { BLOCKSCOUT_API, FAUCET_ADDRESS, VERIFICATION_REWARDS_ADDRESS } from './config'
import { EventArgs, EventInterface, EventTypes, TransferEvent } from './schema'
import { formatCommentString, getContractAddresses } from './utils'

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

export interface BlockscoutTransaction {
  value: string
  txreceipt_status: string
  transactionIndex: string
  to: string
  timeStamp: string
  nonce: string
  isError: string
  input: string
  hash: string
  gasUsed: string
  gasPrice: string
  gas: string
  from: string
  cumulativeGasUsed: string
  contractAddress: string
  confirmations: string
  blockNumber: string
  blockHash: string
}

export class BlockscoutAPI extends RESTDataSource {
  tokenAddressMapping: { [key: string]: string } | undefined
  attestationsAddress: string | undefined
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

  async ensureTokenAddresses() {
    if (this.tokenAddressMapping && this.attestationsAddress) {
      // Already got addresses
      return
    } else {
      const addresses = await getContractAddresses()
      this.attestationsAddress = addresses.attestationsAddress
      this.tokenAddressMapping = addresses.tokenAddressMapping
    }
  }

  getTokenAtAddress(tokenAddress: string) {
    if (this.tokenAddressMapping) {
      const lowerCaseTokenAddress = tokenAddress.toLowerCase()
      if (lowerCaseTokenAddress in this.tokenAddressMapping) {
        return this.tokenAddressMapping[lowerCaseTokenAddress]
      } else {
        console.info('Token addresses mapping: ' + JSON.stringify(this.tokenAddressMapping))
        throw new Error(
          'No token corresponding to ' +
            lowerCaseTokenAddress +
            '. Check web3 provider is for correct network.'
        )
      }
    } else {
      throw new Error('Cannot find tokenAddressMapping')
    }
  }

  getAttestationAddress() {
    if (this.attestationsAddress) {
      return this.attestationsAddress
    } else {
      throw new Error('Cannot find attestation address')
    }
  }

  // LIMITATION:
  // This function will only return Gold transfers that happened via the GoldToken
  // contract. Any native transfers of Gold will be omitted because of how blockscout
  // works. To get native transactions from blockscout, we'd need to use the param:
  // "action: MODULE_ACTIONS.ACCOUNT.TX_LIST"
  // However, the results returned from that API call do not have an easily-parseable
  // representation of Token transfers, if they are included at all. Given that we
  // expect native transfers to be exceedingly rare, the work to handle this is being
  // skipped for now. TODO: (yerdua) [226]
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

    await this.ensureTokenAddresses()
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
          timestamp: new BigNumber(inEvent.timeStamp).toNumber(),
          block: new BigNumber(inEvent.blockNumber).toNumber(),
          inSymbol: this.getTokenAtAddress(inEvent.contractAddress),
          inValue: new BigNumber(inEvent.value).dividedBy(WEI_PER_GOLD).toNumber(),
          outSymbol: this.getTokenAtAddress(outEvent.contractAddress),
          outValue: new BigNumber(outEvent.value).dividedBy(WEI_PER_GOLD).toNumber(),
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
          eventFromAddress,
          this.getAttestationAddress()
        )
        events.push({
          type,
          timestamp: new BigNumber(event.timeStamp).toNumber(),
          block: new BigNumber(event.blockNumber).toNumber(),
          value: new BigNumber(event.value).dividedBy(WEI_PER_GOLD).toNumber(),
          address,
          comment,
          symbol: this.getTokenAtAddress(event.contractAddress) || 'unknown',
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
    await this.ensureTokenAddresses()
    for (const t of rawTransactions) {
      // Only include verification rewards transfers
      if (t.from.toLowerCase() !== VERIFICATION_REWARDS_ADDRESS) {
        continue
      }
      rewards.push({
        type: EventTypes.VERIFICATION_REWARD,
        timestamp: new BigNumber(t.timeStamp).toNumber(),
        block: new BigNumber(t.blockNumber).toNumber(),
        value: new BigNumber(t.value).dividedBy(WEI_PER_GOLD).toNumber(),
        address: VERIFICATION_REWARDS_ADDRESS,
        comment: t.input ? formatCommentString(t.input) : '',
        symbol: this.getTokenAtAddress(t.contractAddress),
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
  eventFromAddress: string,
  attestationsAddress: string
): [EventTypes, string] {
  if (eventToAddress === userAddress && eventFromAddress === FAUCET_ADDRESS) {
    return [EventTypes.FAUCET, FAUCET_ADDRESS]
  }
  if (eventToAddress === attestationsAddress && eventFromAddress === userAddress) {
    return [EventTypes.VERIFICATION_FEE, attestationsAddress]
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
