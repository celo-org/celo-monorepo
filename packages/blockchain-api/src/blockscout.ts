import { RESTDataSource } from 'apollo-datasource-rest'
import { BLOCKSCOUT_API, FAUCET_ADDRESS } from './config'
import {
  Any,
  ContractCall,
  EscrowReceived,
  EscrowSent,
  ExchangeCeloToToken,
  ExchangeTokenToCelo,
  Faucet,
  TokenReceived,
  TokenSent,
  Verification,
} from './events'
import { EscrowContractCall } from './events/EscrowContractCall'
import { ExchangeContractCall } from './events/ExchangeContractCall'
import { RegisterAccountDekContractCall } from './events/RegisterAccountDekContractCall'
import { Input } from './helpers/Input'
import { InputDecoder } from './helpers/InputDecoder'
import { TokenTransactionArgs } from './schema'
import { Transaction } from './transaction/Transaction'
import { TransactionAggregator } from './transaction/TransactionAggregator'
import { TransactionClassifier } from './transaction/TransactionClassifier'
import { TransferCollection } from './transaction/TransferCollection'
import { TransfersNavigator } from './transaction/TransfersNavigator'
import { ContractAddresses, getContractAddresses } from './utils'

export interface BlockscoutTransferTx {
  blockNumber: number
  transactionHash: string
  timestamp: string
  gasPrice: string
  gasUsed: string
  feeToken: string
  gatewayFee: string
  gatewayFeeRecipient: string
  input: string
  celoTransfers: BlockscoutCeloTransfer[]
}

export interface BlockscoutCeloTransfer {
  fromAddressHash: string
  toAddressHash: string
  token: string
  value: string
}

export class BlockscoutAPI extends RESTDataSource {
  contractAddresses: ContractAddresses | undefined

  constructor() {
    super()
    this.baseURL = BLOCKSCOUT_API
  }

  async getRawTokenTransactions(address: string): Promise<Transaction[]> {
    console.info(`Getting token transactions for address: ${address}`)

    const contractAddresses = await this.ensureContractAddresses()

    const response = await this.post('', {
      query: `
        query Transfers($address: String!) {
          # TXs related to cUSD or cGLD transfers
          transferTxs(addressHash: $address, first: 100) {
            edges {
              node {
                transactionHash
                blockNumber
                timestamp
                gasPrice
                gasUsed
                feeToken
                gatewayFee
                gatewayFeeRecipient
                input
                # Transfers associated with the TX
                celoTransfer(first: 10) {
                  edges {
                    node {
                      fromAddressHash
                      toAddressHash
                      value
                      token
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: { address },
    })

    const transactions = response.data.transferTxs.edges.map(({ node }: any) => {
      const { celoTransfer, ...partialTransferTx } = node
      const celoTransfers = node.celoTransfer.edges.map((edge: any) => edge.node)

      const transferCollection = new TransferCollection(celoTransfers)
      const transfersNavigator = new TransfersNavigator(
        contractAddresses,
        FAUCET_ADDRESS,
        transferCollection
      )
      const inputDecoder = new InputDecoder(
        contractAddresses,
        Input.fromString(partialTransferTx.input)
      )

      return new Transaction(partialTransferTx, transfersNavigator, inputDecoder)
    })

    return transactions
  }

  async ensureContractAddresses(): Promise<ContractAddresses> {
    if (!this.contractAddresses) {
      const contractAddresses = await getContractAddresses()

      if (!contractAddresses.Attestations) {
        throw new Error('Cannot find attestation address')
      }
      if (!contractAddresses.Escrow) {
        throw new Error('Cannot find escrow address')
      }
      if (!contractAddresses.Exchange) {
        throw new Error('Cannot find exchange address')
      }
      if (!contractAddresses.Reserve) {
        throw new Error('Cannot find reserve address')
      }

      this.contractAddresses = contractAddresses
    }

    return this.contractAddresses
  }

  async getTokenTransactions(args: TokenTransactionArgs) {
    const userAddress = args.address.toLowerCase()
    const token = args.token
    const rawTransactions = await this.getRawTokenTransactions(userAddress)

    const context = {
      userAddress,
      token,
    }

    const transactionClassifier = new TransactionClassifier([
      new ExchangeContractCall(context),
      new EscrowContractCall(context),
      new RegisterAccountDekContractCall(context),
      new ContractCall(context),
      new Verification(context),
      new EscrowSent(context),
      new TokenSent(context),
      new Faucet(context),
      new EscrowReceived(context),
      new TokenReceived(context),
      new ExchangeCeloToToken(context),
      new ExchangeTokenToCelo(context),
      new Any(context),
    ])

    const classifiedTransactions = rawTransactions.map((transaction) =>
      transactionClassifier.classify(transaction)
    )

    const aggregatedTransactions = TransactionAggregator.aggregate(classifiedTransactions)

    const events: any[] = aggregatedTransactions.map(({ transaction, type }) => {
      try {
        return type.getEvent(transaction)
      } catch (e) {
        console.error('Could not map to an event', JSON.stringify(transaction))
        console.error(e)
      }
    })

    console.info(
      `[Celo] getTokenTransactions address=${args.address} token=${token} localCurrencyCode=${args.localCurrencyCode}} rawTransactionCount=${rawTransactions.length} eventCount=${events.length}`
    )

    return events
      .filter((e) => e)
      .filter((event) => event.amount.currencyCode === token)
      .sort((a, b) => b.timestamp - a.timestamp)
  }
}
