import BigNumber from 'bignumber.js'
import { areRecipientsEquivalent, Recipient } from 'src/recipients/recipient'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { Actions, ActionTypes } from 'src/send/actions'
import { timeDeltaInHours } from 'src/utils/time'

// Sets the limit of recent recipients we want to store
const RECENT_RECIPIENTS_TO_STORE = 8

// We need to know the last 24 hours of payments (for compliance reasons)
export interface PaymentInfo {
  timestamp: number
  amount: number
}

export interface State {
  isSending: boolean
  recentRecipients: Recipient[]
  // keep a list of recent (last 24 hours) payments
  // TODO(erdal) when do we clean this up?
  recentPayments: PaymentInfo[]
}

const initialState = {
  isSending: false,
  recentRecipients: [],
  recentPayments: [],
}

export const sendReducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
) => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      return {
        ...state,
        ...getRehydratePayload(action, 'send'),
        isSending: false,
        recipientCache: {},
      }
    }
    case Actions.SEND_PAYMENT_OR_INVITE:
      return sendPaymentOrInvite(state, action.amount, action.timestamp)
    case Actions.SEND_PAYMENT_OR_INVITE_SUCCESS:
    case Actions.SEND_PAYMENT_OR_INVITE_FAILURE:
      return {
        ...state,
        isSending: false,
      }
    case Actions.STORE_LATEST_IN_RECENTS:
      return storeLatestRecentReducer(state, action.recipient)
    default:
      return state
  }
}

const sendPaymentOrInvite = (state: State, amount: BigNumber, timestamp: number) => {
  const latestPayment = { timestamp, amount }

  // keep only the last 24 hours
  const paymentsLast24Hours = state.recentPayments.filter(
    (p: PaymentInfo) => timeDeltaInHours(timestamp, p.timestamp) < 24
  )

  const recentPayments = [...paymentsLast24Hours, latestPayment]

  return {
    ...state,
    isSending: true,
    recentPayments,
  }
}

const storeLatestRecentReducer = (state: State, newRecipient: Recipient) => {
  const recentRecipients = [
    newRecipient,
    ...state.recentRecipients.filter(
      (existingRecipient) => !areRecipientsEquivalent(newRecipient, existingRecipient)
    ),
  ].slice(0, RECENT_RECIPIENTS_TO_STORE)

  return {
    ...state,
    recentRecipients,
  }
}
