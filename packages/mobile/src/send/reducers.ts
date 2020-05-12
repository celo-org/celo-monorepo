import { areRecipientsEquivalent, Recipient } from 'src/recipients/recipient'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { Actions, ActionTypes } from 'src/send/actions'

// Sets the limit of recent recipients we want to store
const RECENT_RECIPIENTS_TO_STORE = 8

export interface ManuallyValidatedE164NumberToAddress {
  [e164Number: string]: string
}

export interface State {
  isSending: boolean
  recentRecipients: Recipient[]
  isValidRecipient: boolean
  manualAddressValidationRequired: boolean
  fullValidationRequired: boolean
  manuallyValidatedE164NumberToAddress: ManuallyValidatedE164NumberToAddress
}

const initialState = {
  isSending: false,
  recentRecipients: [],
  isValidRecipient: false,
  manualAddressValidationRequired: false,
  fullValidationRequired: false,
  manuallyValidatedE164NumberToAddress: {},
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
        isValidRecipient: false,
      }
    case Actions.VALIDATE_RECIPIENT_ADDRESS_SUCCESS:
      const { manuallyValidatedE164NumberToAddress } = state
      // overwrite the previous mapping every time a new one is validated
      manuallyValidatedE164NumberToAddress[action.e164Number] = action.validatedAddress
      return {
        ...state,
        isValidRecipient: true,
        manualAddressValidationRequired: false,
        manuallyValidatedE164NumberToAddress,
      }
    case Actions.VALIDATE_RECIPIENT_ADDRESS_FAILURE:
      return {
        ...state,
        isValidRecipient: false,
      }
    case Actions.MANUAL_ADDRESS_VALIDATION_REQUIRED:
      return {
        ...state,
        manualAddressValidationRequired: action.validationRequired,
        fullValidationRequired: action.fullValidationRequired,
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

export const manualAddressValidationRequiredSelector = (state: RootState) =>
  state.send.manualAddressValidationRequired

export const manuallyValidatedE164NumberToAddressSelector = (state: RootState) =>
  state.send.manuallyValidatedE164NumberToAddress
