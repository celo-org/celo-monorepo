import { Actions, ActionTypes, EscrowedPayment } from 'src/escrow/actions'

export interface State {
  sentEscrowedPayments: EscrowedPayment[]
}

export const initialState = {
  sentEscrowedPayments: [],
}

export const escrowReducer = (state: State | undefined = initialState, action: ActionTypes) => {
  switch (action.type) {
    case Actions.STORE_SENT_PAYMENTS:
      return {
        ...state,
        sentEscrowedPayments: action.sentPayments,
      }
    default:
      return state
  }
}
