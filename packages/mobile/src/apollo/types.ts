import { Query } from 'react-apollo'
import { TransactionTypes } from 'src/transactions/reducer'

export interface UserTransactionsVariables {
  address: string
}

export enum EventTypeNames {
  Exchange = 'Exchange',
  Transfer = 'Transfer',
}

export interface HomeExchangeFragment {
  __typename: EventTypeNames.Exchange
  type: TransactionTypes
  hash: string
  inValue: number
  outValue: number
  inSymbol: string
  outSymbol: string
  timestamp: number
}

export interface HomeTransferFragment {
  __typename: EventTypeNames.Transfer
  type: TransactionTypes
  hash: string
  value: number
  symbol: string
  timestamp: number
  address: string
  comment: string
  // TODO: fee needs to be added here
}

export type Event = HomeExchangeFragment | HomeTransferFragment
export interface UserTransactionsData {
  events?: Event[] | null
}

export default class UserTransactionsQuery extends Query<
  UserTransactionsData,
  UserTransactionsVariables
> {}
