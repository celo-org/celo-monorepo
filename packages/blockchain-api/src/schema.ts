import { gql } from 'apollo-server-express'
import BigNumber from 'bignumber.js'
import { DataSources } from './apolloServer'

export enum EventTypes {
  EXCHANGE = 'EXCHANGE',
  RECEIVED = 'RECEIVED',
  SENT = 'SENT',
  FAUCET = 'FAUCET',
  VERIFICATION_REWARD = 'VERIFICATION_REWARD',
  VERIFICATION_FEE = 'VERIFICATION_FEE',
  ESCROW_SENT = 'ESCROW_SENT',
  ESCROW_RECEIVED = 'ESCROW_RECEIVED',
}

export interface ExchangeEvent {
  type: EventTypes
  timestamp: number
  block: number
  outValue: number
  outSymbol: string
  inValue: number
  inSymbol: string
  hash: string
}

export interface TransferEvent {
  type: EventTypes
  timestamp: number
  block: number
  value: number
  address: string
  comment: string
  symbol: string
  hash: string
}

export type EventInterface = ExchangeEvent | TransferEvent

export interface EventArgs {
  // Query params as defined by Blockscout's API
  address: string
  sort?: 'asc' | 'desc'
  startblock?: number
  endblock?: number
  page?: number
  offset?: number
}

export interface TokenTransactionArgs {
  address: string
  token: 'cUSD' | 'cGLD'
  localCurrencyCode: string
}

export interface ExchangeRate {
  rate: number
}

export interface CurrencyConversionArgs {
  sourceCurrencyCode?: string
  currencyCode: string
  timestamp?: number
}

export interface MoneyAmount {
  value: BigNumber.Value
  currencyCode: string
  timestamp: number
}

export const typeDefs = gql`
  union Event = Exchange | Transfer

  type Exchange {
    type: String!
    # TODO(kamyar): Graphql currently does not support 64-bit int
    timestamp: Float!
    block: Int!
    outValue: Float!
    outSymbol: String!
    inValue: Float!
    inSymbol: String!
    hash: String!
  }

  type Transfer {
    type: String!
    # TODO(kamyar): Graphql currently does not support 64-bit int
    timestamp: Float!
    block: Int!
    value: Float!
    address: String!
    comment: String
    symbol: String!
    hash: String!
  }

  type ExchangeRate {
    rate: Decimal!
  }

  """
  Timestamp in milliseconds, represented as Float
  """
  scalar Timestamp
  """
  The address (40 (hex) characters / 160 bits / 20 bytes) is derived from the public key (128 (hex) characters / 512 bits / 64 bytes) which is derived from the private key (64 (hex) characters / 256 bits / 32 bytes).

  The address is actually the last 40 characters of the keccak-256 hash of the public key with 0x appended.

  Represented as String.
  """
  scalar Address
  """
  Custom scalar for decimal amounts, represented as String
  """
  scalar Decimal

  enum Token {
    cUSD
    cGLD
  }

  type MoneyAmount {
    value: Decimal!
    currencyCode: String!
    localAmount: LocalMoneyAmount
  }

  type LocalMoneyAmount {
    value: Decimal!
    currencyCode: String!
    exchangeRate: Decimal!
  }

  enum TokenTransactionType {
    EXCHANGE
    RECEIVED
    SENT
    ESCROW_SENT
    ESCROW_RECEIVED
    FAUCET
    VERIFICATION_REWARD
    VERIFICATION_FEE
    INVITE_SENT
    INVITE_RECEIVED
    PAY_REQUEST
    NETWORK_FEE
  }

  interface TokenTransaction {
    type: TokenTransactionType!
    timestamp: Timestamp!
    block: String!
    # signed amount (+/-)
    amount: MoneyAmount!
    hash: String!
  }

  type TokenTransfer implements TokenTransaction {
    type: TokenTransactionType!
    timestamp: Timestamp!
    block: String!
    # signed amount (+/-)
    amount: MoneyAmount!
    address: Address!
    comment: String
    token: Token!
    hash: String!
  }

  type TokenExchange implements TokenTransaction {
    type: TokenTransactionType!
    timestamp: Timestamp!
    block: String!
    # signed amount (+/-)
    amount: MoneyAmount!
    takerAmount: MoneyAmount!
    makerAmount: MoneyAmount!
    hash: String!
  }

  type TokenTransactionConnection {
    edges: [TokenTransactionEdge!]!
    pageInfo: PageInfo!
  }

  type TokenTransactionEdge {
    node: TokenTransaction
    cursor: String!
  }

  type PageInfo {
    hasPreviousPage: Boolean!
    hasNextPage: Boolean!
    firstCursor: String
    lastCursor: String
  }

  type Query {
    rewards(
      address: String!
      sort: String
      startblock: Int
      endblock: Int
      page: Int
      offset: Int
    ): [Transfer]

    tokenTransactions(
      address: Address!
      token: Token!
      localCurrencyCode: String
      # pagination
      before: String
      last: Int
      after: String
      first: Int
    ): TokenTransactionConnection

    currencyConversion(
      sourceCurrencyCode: String
      currencyCode: String!
      timestamp: Timestamp
    ): ExchangeRate
  }
`

interface Context {
  dataSources: DataSources
  localCurrencyCode?: string
}

export const resolvers = {
  Query: {
    rewards: async (_source: any, args: EventArgs, { dataSources }: Context) => {
      return dataSources.blockscoutAPI.getFeedRewards(args)
    },
    tokenTransactions: async (_source: any, args: TokenTransactionArgs, context: Context) => {
      const { dataSources } = context
      context.localCurrencyCode = args.localCurrencyCode
      const transactions = await dataSources.blockscoutAPI.getTokenTransactions(args)

      return {
        edges: transactions.map((tx) => ({
          node: tx,
          cursor: 'TODO',
        })),
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
          firstCursor: 'TODO',
          lastCursor: 'TODO',
        },
      }
    },
    currencyConversion: async (
      _source: any,
      args: CurrencyConversionArgs,
      { dataSources }: Context
    ) => {
      const rate = await dataSources.currencyConversionAPI.getExchangeRate(args)
      return { rate: rate.toNumber() }
    },
  },
  // TODO(kamyar):  see the comment about union causing problems
  Event: {
    __resolveType(obj: EventInterface, context: any, info: any) {
      if (obj.type === EventTypes.EXCHANGE) {
        return 'Exchange'
      }
      if (
        obj.type === EventTypes.RECEIVED ||
        obj.type === EventTypes.ESCROW_RECEIVED ||
        obj.type === EventTypes.ESCROW_SENT ||
        obj.type === EventTypes.SENT ||
        obj.type === EventTypes.FAUCET ||
        obj.type === EventTypes.VERIFICATION_FEE ||
        obj.type === EventTypes.VERIFICATION_REWARD
      ) {
        return 'Transfer'
      }
      return null
    },
  },
  TokenTransaction: {
    __resolveType(obj: EventInterface, context: any, info: any) {
      if (obj.type === EventTypes.EXCHANGE) {
        return 'TokenExchange'
      }
      if (
        obj.type === EventTypes.RECEIVED ||
        obj.type === EventTypes.ESCROW_RECEIVED ||
        obj.type === EventTypes.ESCROW_SENT ||
        obj.type === EventTypes.SENT ||
        obj.type === EventTypes.FAUCET ||
        obj.type === EventTypes.VERIFICATION_FEE ||
        obj.type === EventTypes.VERIFICATION_REWARD
      ) {
        return 'TokenTransfer'
      }
      return null
    },
  },
  MoneyAmount: {
    localAmount: async (moneyAmount: MoneyAmount, args: any, context: Context) => {
      const { dataSources, localCurrencyCode } = context
      const rate = await dataSources.currencyConversionAPI.getExchangeRate({
        sourceCurrencyCode: moneyAmount.currencyCode,
        currencyCode: localCurrencyCode || 'USD',
        timestamp: moneyAmount.timestamp,
      })
      return {
        value: new BigNumber(moneyAmount.value).multipliedBy(rate).toString(),
        currencyCode: localCurrencyCode || 'USD',
        exchangeRate: rate.toString(),
      }
    },
  },
}
