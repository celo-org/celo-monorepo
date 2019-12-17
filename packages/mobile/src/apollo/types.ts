import { Query } from 'react-apollo'
import { CURRENCY_ENUM } from 'src/geth/consts'
import {
  TransactionStatus,
  TransactionTypes,
  TransferTransactionTypes,
} from 'src/transactions/reducer'

export interface UserTransactionsVariables {
  address: string
}

export interface ExchangeTransaction {
  type: TransactionTypes.EXCHANGE
  id?: string
  hash?: string
  inValue: number
  outValue: number
  inSymbol: CURRENCY_ENUM
  outSymbol: CURRENCY_ENUM
  timestamp: number
  status?: TransactionStatus
}

export interface TransferTransaction {
  type: TransferTransactionTypes
  id?: string
  hash?: string
  value: number
  symbol: CURRENCY_ENUM
  timestamp: number
  address: string
  comment: string
  status?: TransactionStatus
  // TODO: fee needs to be added here
}

export interface HomeExchangeFragment extends ExchangeTransaction {
  hash: string
}

export interface HomeTransferFragment extends TransferTransaction {
  hash: string
}

export type Transaction = ExchangeTransaction | TransferTransaction
export interface UserTransactionsData {
  events?: Transaction[] | null
}

export default class UserTransactionsQuery extends Query<
  UserTransactionsData,
  UserTransactionsVariables
> {}
