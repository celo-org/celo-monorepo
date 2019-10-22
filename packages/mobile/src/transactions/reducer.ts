import BigNumber from 'bignumber.js'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Actions, ActionTypes } from 'src/transactions/actions'

export interface ExchangeStandby {
  id: string
  type: TransactionTypes.EXCHANGE
  status: TransactionStatus
  inSymbol: CURRENCY_ENUM
  inValue: string
  outSymbol: CURRENCY_ENUM
  outValue: string
  timestamp: number
  hash?: string
}
export interface TransferStandby {
  id: string
  type: TransferTransactionTypes
  status: TransactionStatus
  value: string | BigNumber
  comment: string
  symbol: CURRENCY_ENUM
  timestamp: number
  address: string
  hash?: string
}

export type StandbyTransaction = ExchangeStandby | TransferStandby

export enum TransactionStatus {
  Pending = 'Pending',
  Complete = 'Complete',
  Failed = 'Failed',
}

// Should correspond to EventTypes enum in blockchain api
export enum TransactionTypes {
  EXCHANGE = 'EXCHANGE',
  RECEIVED = 'RECEIVED',
  SENT = 'SENT',
  FAUCET = 'FAUCET',
  VERIFICATION_REWARD = 'VERIFICATION_REWARD',
  VERIFICATION_FEE = 'VERIFICATION_FEE',
  INVITE_SENT = 'INVITE_SENT',
  INVITE_RECEIVED = 'INVITE_RECEIVED',
  PAY_REQUEST = 'PAY_REQUEST',
  NETWORK_FEE = 'NETWORK_FEE',
}

type TransferTransactionTypes =
  | TransactionTypes.SENT
  | TransactionTypes.RECEIVED
  | TransactionTypes.FAUCET
  | TransactionTypes.VERIFICATION_REWARD
  | TransactionTypes.VERIFICATION_FEE
  | TransactionTypes.INVITE_SENT
  | TransactionTypes.INVITE_RECEIVED
  | TransactionTypes.NETWORK_FEE

export interface State {
  standbyTransactions: StandbyTransaction[]
}

const initialState = {
  standbyTransactions: [],
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.ADD_STANDBY_TRANSACTION:
      return {
        ...state,
        standbyTransactions: [action.transaction, ...(state.standbyTransactions || [])],
      }
    case Actions.REMOVE_STANDBY_TRANSACTION:
      return {
        ...state,
        standbyTransactions: state.standbyTransactions.filter(
          (tx: StandbyTransaction) => tx.id !== action.idx
        ),
      }
    case Actions.RESET_STANDBY_TRANSACTIONS:
      return {
        ...state,
        standbyTransactions: [],
      }
    case Actions.ADD_HASH_TO_STANDBY_TRANSACTIONS:
      return {
        ...state,
        standbyTransactions: state.standbyTransactions.map((tx) => {
          if (tx.id === action.idx) {
            tx.hash = action.hash
          }
          return tx
        }),
      }
    default:
      return state
  }
}
