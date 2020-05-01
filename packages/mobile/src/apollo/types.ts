/*
 * THIS FILE HAS BEEN GENERATED. DO NOT EDIT IT DIRECTLY.
 *
 * REGENERATE WITH:
 * `yarn run build:gen-graphql-types`
 */

import BigNumber from 'bignumber.js'

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
  Decimal: BigNumber.Value
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
  tokenTransactions?: Maybe<TokenTransactionConnection>
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

export interface QueryTokenTransactionsArgs {
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

export type TokenExchange = TokenTransaction & {
  __typename?: 'TokenExchange'
  type: TokenTransactionType
  timestamp: Scalars['Timestamp']
  block: Scalars['String']
  amount: MoneyAmount
  takerAmount: MoneyAmount
  makerAmount: MoneyAmount
  hash: Scalars['String']
}

export interface TokenTransaction {
  type: TokenTransactionType
  timestamp: Scalars['Timestamp']
  block: Scalars['String']
  amount: MoneyAmount
  hash: Scalars['String']
}

export interface TokenTransactionConnection {
  __typename?: 'TokenTransactionConnection'
  edges: TokenTransactionEdge[]
  pageInfo: PageInfo
}

export interface TokenTransactionEdge {
  __typename?: 'TokenTransactionEdge'
  node?: Maybe<TokenTransaction>
  cursor: Scalars['String']
}

export enum TokenTransactionType {
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

export type TokenTransfer = TokenTransaction & {
  __typename?: 'TokenTransfer'
  type: TokenTransactionType
  timestamp: Scalars['Timestamp']
  block: Scalars['String']
  amount: MoneyAmount
  address: Scalars['Address']
  comment?: Maybe<Scalars['String']>
  token: Token
  hash: Scalars['String']
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
  currencyConversion: Maybe<{ __typename?: 'ExchangeRate'; rate: BigNumber.Value }>
}

export interface ExchangeItemFragment {
  __typename: 'TokenExchange'
  type: TokenTransactionType
  hash: string
  timestamp: number
  amount: {
    __typename?: 'MoneyAmount'
    value: BigNumber.Value
    currencyCode: string
    localAmount: Maybe<{
      __typename?: 'LocalMoneyAmount'
      value: BigNumber.Value
      currencyCode: string
      exchangeRate: BigNumber.Value
    }>
  }
  takerAmount: {
    __typename?: 'MoneyAmount'
    value: BigNumber.Value
    currencyCode: string
    localAmount: Maybe<{
      __typename?: 'LocalMoneyAmount'
      value: BigNumber.Value
      currencyCode: string
      exchangeRate: BigNumber.Value
    }>
  }
  makerAmount: {
    __typename?: 'MoneyAmount'
    value: BigNumber.Value
    currencyCode: string
    localAmount: Maybe<{
      __typename?: 'LocalMoneyAmount'
      value: BigNumber.Value
      currencyCode: string
      exchangeRate: BigNumber.Value
    }>
  }
}

type TransactionFeed_TokenExchange_Fragment = {
  __typename?: 'TokenExchange'
} & ExchangeItemFragment

type TransactionFeed_TokenTransfer_Fragment = {
  __typename?: 'TokenTransfer'
} & TransferItemFragment

export type TransactionFeedFragment =
  | TransactionFeed_TokenExchange_Fragment
  | TransactionFeed_TokenTransfer_Fragment

export interface UserTransactionsQueryVariables {
  address: Scalars['Address']
  token: Token
  localCurrencyCode?: Maybe<Scalars['String']>
}

export interface UserTransactionsQuery {
  __typename?: 'Query'
  tokenTransactions: Maybe<{
    __typename?: 'TokenTransactionConnection'
    edges: Array<{
      __typename?: 'TokenTransactionEdge'
      node: Maybe<
        | ({ __typename?: 'TokenExchange' } & TransactionFeed_TokenExchange_Fragment)
        | ({ __typename?: 'TokenTransfer' } & TransactionFeed_TokenTransfer_Fragment)
      >
    }>
  }>
}

export interface TransferItemFragment {
  __typename: 'TokenTransfer'
  type: TokenTransactionType
  hash: string
  timestamp: number
  address: string
  comment: Maybe<string>
  amount: {
    __typename?: 'MoneyAmount'
    value: BigNumber.Value
    currencyCode: string
    localAmount: Maybe<{
      __typename?: 'LocalMoneyAmount'
      value: BigNumber.Value
      currencyCode: string
      exchangeRate: BigNumber.Value
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
export const introspectionQueryResultData: IntrospectionResultData = {
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
        name: 'TokenTransaction',
        possibleTypes: [
          {
            name: 'TokenExchange',
          },
          {
            name: 'TokenTransfer',
          },
        ],
      },
    ],
  },
}
