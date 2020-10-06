import { Actions, ActionTypes } from 'src/paymentRequest/actions'
import { PaymentRequest } from 'src/paymentRequest/types'

export interface State {
  incomingPaymentRequests: PaymentRequest[]
  outgoingPaymentRequests: PaymentRequest[]
}

export const initialState = {
  incomingPaymentRequests: [],
  outgoingPaymentRequests: [],
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.UPDATE_INCOMING_REQUESTS:
      return {
        ...state,
        incomingPaymentRequests: action.paymentRequests,
      }
    case Actions.UPDATE_OUTGOING_REQUESTS:
      return {
        ...state,
        outgoingPaymentRequests: action.paymentRequests,
      }
    default:
      return state
  }
}
