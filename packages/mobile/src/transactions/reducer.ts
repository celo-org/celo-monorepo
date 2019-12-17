import { ExchangeTransaction, TransferTransaction } from 'src/apollo/types'
import { Actions, ActionTypes } from 'src/transactions/actions'

export interface ExchangeStandby extends ExchangeTransaction {
  id: string
  status: TransactionStatus
}
export interface TransferStandby extends TransferTransaction {
  id: string
  status: TransactionStatus
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
  ESCROW_SENT = 'ESCROW_SENT',
  ESCROW_RECEIVED = 'ESCROW_RECEIVED',
  FAUCET = 'FAUCET',
  VERIFICATION_REWARD = 'VERIFICATION_REWARD',
  VERIFICATION_FEE = 'VERIFICATION_FEE',
  INVITE_SENT = 'INVITE_SENT',
  INVITE_RECEIVED = 'INVITE_RECEIVED',
  PAY_REQUEST = 'PAY_REQUEST',
  NETWORK_FEE = 'NETWORK_FEE',
}

export type TransferTransactionTypes =
  | TransactionTypes.SENT
  | TransactionTypes.RECEIVED
  | TransactionTypes.ESCROW_RECEIVED
  | TransactionTypes.ESCROW_SENT
  | TransactionTypes.FAUCET
  | TransactionTypes.VERIFICATION_REWARD
  | TransactionTypes.VERIFICATION_FEE
  | TransactionTypes.INVITE_SENT
  | TransactionTypes.INVITE_RECEIVED
  | TransactionTypes.NETWORK_FEE

export const isTransferType = (txType: TransactionTypes) => {
  if (
    txType === TransactionTypes.SENT ||
    txType === TransactionTypes.RECEIVED ||
    txType === TransactionTypes.ESCROW_RECEIVED ||
    txType === TransactionTypes.ESCROW_SENT ||
    txType === TransactionTypes.FAUCET ||
    txType === TransactionTypes.VERIFICATION_REWARD ||
    txType === TransactionTypes.VERIFICATION_FEE ||
    txType === TransactionTypes.INVITE_SENT ||
    txType === TransactionTypes.INVITE_RECEIVED ||
    txType === TransactionTypes.NETWORK_FEE
  ) {
    return true
  }
  return false
}

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
