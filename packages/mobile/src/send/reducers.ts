import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { Actions, ActionTypes } from 'src/send/actions'
import { insertAtBeginning } from 'src/utils/insertAtBeginning'
import { NumberToRecipient } from 'src/utils/recipient'

// Sets the limit of recent recipients we want to store
const RECENT_PHONE_NUMBERS_TO_STORE = 8

export interface State {
  isSending: boolean
  recentPhoneNumbers: string[]
  recipientCache: NumberToRecipient
}

const initialState = {
  isSending: false,
  recentPhoneNumbers: [],
  recipientCache: {},
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
      const recentPhoneNumbers = insertAtBeginning(
        action.key,
        state.recentPhoneNumbers || []
      ).slice(0, RECENT_PHONE_NUMBERS_TO_STORE)
      return { ...state, recentPhoneNumbers }

    case Actions.SET_RECIPIENT_CACHE:
      return {
        ...state,
        recipientCache: action.recipients,
      }
    default:
      return state
  }
}

export const recipientCacheSelector = (state: RootState) => state.send.recipientCache
