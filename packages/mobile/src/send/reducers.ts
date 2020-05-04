import { areRecipientsEquivalent, Recipient } from 'src/recipients/recipient'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { Actions, ActionTypes } from 'src/send/actions'

// Sets the limit of recent recipients we want to store
const RECENT_RECIPIENTS_TO_STORE = 8

export interface State {
  isSending: boolean
  recentRecipients: Recipient[]
  isValidatingRecipient: boolean
  isValidRecipient: boolean
}

const initialState = {
  isSending: false,
  recentRecipients: [],
  isValidatingRecipient: true,
  isValidRecipient: false,
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
      return {
        ...state,
        isSending: true,
      }
    case Actions.SEND_PAYMENT_OR_INVITE_SUCCESS:
    case Actions.SEND_PAYMENT_OR_INVITE_FAILURE:
      return {
        ...state,
        isSending: false,
      }
    case Actions.STORE_LATEST_IN_RECENTS:
      return storeLatestRecentReducer(state, action.recipient)
    case Actions.VALIDATE_RECIPIENT_ADDRESS:
      return {
        ...state,
        isValidatingRecipient: true,
        isValidRecipient: false,
      }
    case Actions.VALIDATE_RECIPIENT_ADDRESS_SUCCESS:
      return {
        ...state,
        isValidatingRecipient: false,
        isValidRecipient: true,
      }
    case Actions.VALIDATE_RECIPIENT_ADDRESS_FAILURE:
      return {
        ...state,
        isValidatingRecipient: false,
        isValidRecipient: false,
      }
    default:
      return state
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
