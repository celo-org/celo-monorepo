import { Actions, ActionTypes, EscrowedPayment } from 'src/escrow/actions'
import { RootState } from 'src/redux/reducers'

export interface State {
  sentEscrowedPayments: EscrowedPayment[]
  suggestedFee: string | null
}

export const initialState = {
  sentEscrowedPayments: [],
  suggestedFee: null,
}

export const escrowReducer = (state: State | undefined = initialState, action: ActionTypes) => {
  switch (action.type) {
    case Actions.STORE_SENT_PAYMENTS:
      return {
        ...state,
        sentEscrowedPayments: action.sentPayments,
      }
    case Actions.SET_RECLAIM_TRANSACTION_FEE:
      return {
        ...state,
        suggestedFee: action.suggestedFee,
      }
    default:
      return state
  }
}

export const reclaimSuggestedFeeSelector = (state: RootState) => state.escrow.suggestedFee
