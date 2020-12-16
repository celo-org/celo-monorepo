import { gql } from 'apollo-server-express'
import BigNumber from 'bignumber.js'
import { DataSources } from './apolloServer'

export enum EventTypes {
  EXCHANGE = 'EXCHANGE',
  RECEIVED = 'RECEIVED',
  SENT = 'SENT',
  FAUCET = 'FAUCET',
  VERIFICATION_FEE = 'VERIFICATION_FEE',
  ESCROW_SENT = 'ESCROW_SENT',
  ESCROW_RECEIVED = 'ESCROW_RECEIVED',
  CONTRACT_CALL = 'CONTRACT_CALL',
}

export enum FeeType {
  SECURITY_FEE = 'SECURITY_FEE',
  GATEWAY_FEE = 'GATEWAY_FEE',
  ONE_TIME_ENCRYPTION_FEE = 'ONE_TIME_ENCRYPTION_FEE',
  INVITATION_FEE = 'INVITATION_FEE',
}

export interface Fee {
  type: FeeType
  amount: MoneyAmount
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
  fees: Fee[]
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
  fees: Fee[]
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

export type Token = 'cUSD' | 'cGLD'

export interface TokenTransactionArgs {
  address: string
  token: Token
  localCurrencyCode: string
}

export interface ExchangeRate {
  rate: number
}

export interface CurrencyConversionArgs {
  sourceCurrencyCode?: string
  currencyCode: string
  timestamp?: number
  impliedExchangeRates?: MoneyAmount['impliedExchangeRates']
}

export interface MoneyAmount {
  value: BigNumber.Value
  currencyCode: string
  // Implied exchange rate (based on exact amount exchanged) which overwrites
  // the estimate in firebase (based on a constant exchange amount)
  impliedExchangeRates?: { [key: string]: BigNumber.Value }
  timestamp: number
}

export const typeDefs = gql`
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

  enum FeeType {
    SECURITY_FEE
    GATEWAY_FEE
    ONE_TIME_ENCRYPTION_FEE
    INVITATION_FEE
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

  type Fee {
    type: FeeType!
    amount: MoneyAmount!
  }

  enum TokenTransactionType {
    EXCHANGE
    RECEIVED
    SENT
    ESCROW_SENT
    ESCROW_RECEIVED
    FAUCET
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
    fees: [Fee]
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
    fees: [Fee]
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
    fees: [Fee]
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
        obj.type === EventTypes.VERIFICATION_FEE
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
        impliedExchangeRates: moneyAmount.impliedExchangeRates,
      })
      return {
        value: new BigNumber(moneyAmount.value).multipliedBy(rate).toString(),
        currencyCode: localCurrencyCode || 'USD',
        exchangeRate: rate.toString(),
      }
    },
  },
}
