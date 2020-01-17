/*
 * THIS FILE HAS BEEN GENERATED. DO NOT EDIT IT DIRECTLY.
 *
 * REGENERATE WITH:
 * `yarn run build:gen-graphql-types`
 */

export type Maybe<T> = T | null

/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  Address: string
  Timestamp: number
  Decimal: string
  Upload: any
}

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE',
}

export type Event = Exchange | Transfer

export interface Exchange {
  __typename?: 'Exchange'
  type: Scalars['String']
  timestamp: Scalars['Float']
  block: Scalars['Int']
  outValue: Scalars['Float']
  outSymbol: Scalars['String']
  inValue: Scalars['Float']
  inSymbol: Scalars['String']
  hash: Scalars['String']
}

export interface ExchangeRate {
  __typename?: 'ExchangeRate'
  rate: Scalars['Decimal']
}

export interface LocalMoneyAmount {
  __typename?: 'LocalMoneyAmount'
  value: Scalars['Decimal']
  currencyCode: Scalars['String']
  exchangeRate: Scalars['Decimal']
}

export interface MoneyAmount {
  __typename?: 'MoneyAmount'
  value: Scalars['Decimal']
  currencyCode: Scalars['String']
  localAmount?: Maybe<LocalMoneyAmount>
}

export interface PageInfo {
  __typename?: 'PageInfo'
  hasPreviousPage: Scalars['Boolean']
  hasNextPage: Scalars['Boolean']
  firstCursor?: Maybe<Scalars['String']>
  lastCursor?: Maybe<Scalars['String']>
}

export interface Query {
  __typename?: 'Query'
  events?: Maybe<Array<Maybe<Event>>>
  rewards?: Maybe<Array<Maybe<Transfer>>>
  transactions?: Maybe<TransactionConnection>
  currencyConversion?: Maybe<ExchangeRate>
}

export interface QueryEventsArgs {
  address: Scalars['String']
  sort?: Maybe<Scalars['String']>
  startblock?: Maybe<Scalars['Int']>
  endblock?: Maybe<Scalars['Int']>
  page?: Maybe<Scalars['Int']>
  offset?: Maybe<Scalars['Int']>
}

export interface QueryRewardsArgs {
  address: Scalars['String']
  sort?: Maybe<Scalars['String']>
  startblock?: Maybe<Scalars['Int']>
  endblock?: Maybe<Scalars['Int']>
  page?: Maybe<Scalars['Int']>
  offset?: Maybe<Scalars['Int']>
}

export interface QueryTransactionsArgs {
  address: Scalars['Address']
  token: Token
  localCurrencyCode?: Maybe<Scalars['String']>
  before?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  first?: Maybe<Scalars['Int']>
}

export interface QueryCurrencyConversionArgs {
  sourceCurrencyCode?: Maybe<Scalars['String']>
  currencyCode: Scalars['String']
  timestamp?: Maybe<Scalars['Timestamp']>
}

export enum Token {
  CUsd = 'cUSD',
  CGld = 'cGLD',
}

export interface Transaction {
  type: TransactionType
  timestamp: Scalars['Timestamp']
  block: Scalars['String']
  amount: MoneyAmount
  hash: Scalars['String']
}

export interface TransactionConnection {
  __typename?: 'TransactionConnection'
  edges: TransactionEdge[]
  pageInfo: PageInfo
}

export interface TransactionEdge {
  __typename?: 'TransactionEdge'
  node?: Maybe<Transaction>
  cursor: Scalars['String']
}

export type TransactionExchange = Transaction & {
  __typename?: 'TransactionExchange'
  type: TransactionType
  timestamp: Scalars['Timestamp']
  block: Scalars['String']
  amount: MoneyAmount
  takerAmount: MoneyAmount
  makerAmount: MoneyAmount
  hash: Scalars['String']
}

export type TransactionTransfer = Transaction & {
  __typename?: 'TransactionTransfer'
  type: TransactionType
  timestamp: Scalars['Timestamp']
  block: Scalars['String']
  amount: MoneyAmount
  address: Scalars['Address']
  comment?: Maybe<Scalars['String']>
  token: Token
  hash: Scalars['String']
}

export enum TransactionType {
  Exchange = 'EXCHANGE',
  Received = 'RECEIVED',
  Sent = 'SENT',
  EscrowSent = 'ESCROW_SENT',
  EscrowReceived = 'ESCROW_RECEIVED',
  Faucet = 'FAUCET',
  VerificationReward = 'VERIFICATION_REWARD',
  VerificationFee = 'VERIFICATION_FEE',
  InviteSent = 'INVITE_SENT',
  InviteReceived = 'INVITE_RECEIVED',
  PayRequest = 'PAY_REQUEST',
  NetworkFee = 'NETWORK_FEE',
}

export interface Transfer {
  __typename?: 'Transfer'
  type: Scalars['String']
  timestamp: Scalars['Float']
  block: Scalars['Int']
  value: Scalars['Float']
  address: Scalars['String']
  comment?: Maybe<Scalars['String']>
  symbol: Scalars['String']
  hash: Scalars['String']
}

export interface ExchangeRateQueryVariables {
  currencyCode: Scalars['String']
}

export interface ExchangeRateQuery {
  __typename?: 'Query'
  currencyConversion: Maybe<{ __typename?: 'ExchangeRate'; rate: string }>
}

export interface ExchangeItemFragment {
  __typename: 'TransactionExchange'
  type: TransactionType
  hash: string
  timestamp: number
  amount: {
    __typename?: 'MoneyAmount'
    value: string
    currencyCode: string
    localAmount: Maybe<{
      __typename?: 'LocalMoneyAmount'
      value: string
      currencyCode: string
      exchangeRate: string
    }>
  }
  takerAmount: {
    __typename?: 'MoneyAmount'
    value: string
    currencyCode: string
    localAmount: Maybe<{
      __typename?: 'LocalMoneyAmount'
      value: string
      currencyCode: string
      exchangeRate: string
    }>
  }
  makerAmount: {
    __typename?: 'MoneyAmount'
    value: string
    currencyCode: string
    localAmount: Maybe<{
      __typename?: 'LocalMoneyAmount'
      value: string
      currencyCode: string
      exchangeRate: string
    }>
  }
}

type TransactionFeed_TransactionExchange_Fragment = {
  __typename?: 'TransactionExchange'
} & ExchangeItemFragment

type TransactionFeed_TransactionTransfer_Fragment = {
  __typename?: 'TransactionTransfer'
} & TransferItemFragment

export type TransactionFeedFragment =
  | TransactionFeed_TransactionExchange_Fragment
  | TransactionFeed_TransactionTransfer_Fragment

export interface UserTransactionsQueryVariables {
  address: Scalars['Address']
  token: Token
  localCurrencyCode?: Maybe<Scalars['String']>
}

export interface UserTransactionsQuery {
  __typename?: 'Query'
  transactions: Maybe<{
    __typename?: 'TransactionConnection'
    edges: Array<{
      __typename?: 'TransactionEdge'
      node: Maybe<
        | ({ __typename?: 'TransactionExchange' } & TransactionFeed_TransactionExchange_Fragment)
        | ({ __typename?: 'TransactionTransfer' } & TransactionFeed_TransactionTransfer_Fragment)
      >
    }>
  }>
}

export interface TransferItemFragment {
  __typename: 'TransactionTransfer'
  type: TransactionType
  hash: string
  timestamp: number
  address: string
  comment: Maybe<string>
  amount: {
    __typename?: 'MoneyAmount'
    value: string
    currencyCode: string
    localAmount: Maybe<{
      __typename?: 'LocalMoneyAmount'
      value: string
      currencyCode: string
      exchangeRate: string
    }>
  }
}

export interface IntrospectionResultData {
  __schema: {
    types: Array<{
      kind: string
      name: string
      possibleTypes: Array<{
        name: string
      }>
    }>
  }
}
const result: IntrospectionResultData = {
  __schema: {
    types: [
      {
        kind: 'UNION',
        name: 'Event',
        possibleTypes: [
          {
            name: 'Exchange',
          },
          {
            name: 'Transfer',
          },
        ],
      },
      {
        kind: 'INTERFACE',
        name: 'Transaction',
        possibleTypes: [
          {
            name: 'TransactionExchange',
          },
          {
            name: 'TransactionTransfer',
          },
        ],
      },
    ],
  },
}
export default result
