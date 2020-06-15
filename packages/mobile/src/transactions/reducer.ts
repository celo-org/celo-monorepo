import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { Actions, ActionTypes } from 'src/transactions/actions'
import { StandbyTransaction } from 'src/transactions/types'

export interface State {
  // Tracks transactions that have been initiated by the user
  // before they are picked up by the chain explorer and
  // included in the tx feed. Necessary so it shows up in the
  // feed instantly.
  standbyTransactions: StandbyTransaction[]
  // Tracks which set of transactions retrieved in the
  // feed have already been processed by the
  // tx feed query watcher. Necessary so we don't re-process
  // txs more than once.
  knownFeedTransactions: KnownFeedTransactionsType
}

export interface KnownFeedTransactionsType {
  [txHash: string]: boolean
}

const initialState = {
  standbyTransactions: [],
  knownFeedTransactions: {},
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      return {
        ...state,
        ...getRehydratePayload(action, 'transactions'),
        standbyTransactions: [],
      }
    }
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
    case Actions.NEW_TRANSACTIONS_IN_FEED:
      const newKnownFeedTransactions = { ...state.knownFeedTransactions }
      action.transactions.forEach((tx) => (newKnownFeedTransactions[tx.hash] = true))
      return {
        ...state,
        knownFeedTransactions: newKnownFeedTransactions,
      }
    default:
      return state
  }
}

export const standbyTransactionsSelector = (state: RootState) =>
  state.transactions.standbyTransactions

export const knownFeedTransactionsSelector = (state: RootState) =>
  state.transactions.knownFeedTransactions
