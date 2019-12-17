import { Query } from 'react-apollo'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { TransactionTypes, TransferTransactionTypes } from 'src/transactions/reducer'

export interface UserTransactionsVariables {
  address: string
}

export interface ExchangeTransaction {
  type: TransactionTypes.EXCHANGE
  inValue: number
  outValue: number
  inSymbol: CURRENCY_ENUM
  outSymbol: CURRENCY_ENUM
  timestamp: number
}

export interface TransferTransaction {
  type: TransferTransactionTypes
  value: number
  symbol: CURRENCY_ENUM
  timestamp: number
  address: string
  comment: string
  // TODO: fee needs to be added here
}

export interface HomeExchangeFragment extends ExchangeTransaction {
  hash: string
}

export interface HomeTransferFragment extends TransferTransaction {
  hash: string
}

export type Event = HomeExchangeFragment | HomeTransferFragment
export interface UserTransactionsData {
  events?: Event[] | null
}

export default class UserTransactionsQuery extends Query<
  UserTransactionsData,
  UserTransactionsVariables
> {}
