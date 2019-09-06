import { gql } from 'apollo-server-express'
import { DataSources } from './apolloServer'

export enum EventTypes {
  EXCHANGE = 'EXCHANGE',
  RECEIVED = 'RECEIVED',
  SENT = 'SENT',
  FAUCET = 'FAUCET',
  VERIFICATION_REWARD = 'VERIFICATION_REWARD',
  VERIFICATION_FEE = 'VERIFICATION_FEE',
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

export interface ExchangeRate {
  rate: number
}

export interface CurrencyConversionArgs {
  currencyCode: string
  timestamp?: number
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
    rate: Float!
  }

  type Query {
    events(
      address: String!
      sort: String
      startblock: Int
      endblock: Int
      page: Int
      offset: Int
    ): [Event]

    rewards(
      address: String!
      sort: String
      startblock: Int
      endblock: Int
      page: Int
      offset: Int
    ): [Transfer]

    currencyConversion(currencyCode: String!, timestamp: Float): ExchangeRate
  }
`

interface Context {
  dataSources: DataSources
}

export const resolvers = {
  Query: {
    events: async (_source: any, args: EventArgs, { dataSources }: Context) => {
      return dataSources.blockscoutAPI.getFeedEvents(args)
    },
    rewards: async (_source: any, args: EventArgs, { dataSources }: Context) => {
      return dataSources.blockscoutAPI.getFeedRewards(args)
    },
    currencyConversion: async (
      _source: any,
      args: CurrencyConversionArgs,
      { dataSources }: Context
    ) => {
      return dataSources.currencyConversionAPI.getExchangeRate(args)
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
}
