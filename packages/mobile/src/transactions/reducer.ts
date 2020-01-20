import { TokenTransactionType } from 'src/apollo/types'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Actions, ActionTypes } from 'src/transactions/actions'

export interface ExchangeStandby {
  id: string
  type: TokenTransactionType.Exchange
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
  type: TransferTransactionType
  status: TransactionStatus
  value: string
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

type TransferTransactionType =
  | TokenTransactionType.Sent
  | TokenTransactionType.Received
  | TokenTransactionType.EscrowReceived
  | TokenTransactionType.EscrowSent
  | TokenTransactionType.Faucet
  | TokenTransactionType.VerificationReward
  | TokenTransactionType.VerificationFee
  | TokenTransactionType.InviteSent
  | TokenTransactionType.InviteReceived
  | TokenTransactionType.NetworkFee

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
          if (tx.id !== action.idx) {
            return tx
          }
          return {
            ...tx,
            hash: action.hash,
          }
        }),
      }
    default:
      return state
  }
}
