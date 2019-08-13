import { Actions, ActionTypes, EscrowedPayment } from 'src/escrow/actions'
import { RootState } from 'src/redux/reducers'

export interface State {
  isReclaiming: boolean
  sentEscrowedPayments: EscrowedPayment[]
}

export const initialState = {
  isReclaiming: false,
  sentEscrowedPayments: [],
}

export const escrowReducer = (state: State | undefined = initialState, action: ActionTypes) => {
  switch (action.type) {
    case Actions.STORE_SENT_PAYMENTS:
      return {
        ...state,
        sentEscrowedPayments: action.sentPayments,
      }
    case Actions.RECLAIM_PAYMENT:
      return {
        ...state,
        isReclaiming: true,
      }
    case Actions.RECLAIM_PAYMENT_FAILURE:
    case Actions.RECLAIM_PAYMENT_SUCCESS:
      return {
        ...state,
        isReclaiming: false,
      }
    default:
      return state
  }
}

export const sentEscrowedPaymentsSelector = (state: RootState) => state.escrow.sentEscrowedPayments
