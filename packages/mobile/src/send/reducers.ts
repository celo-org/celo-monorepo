import BigNumber from 'bignumber.js'
import { TokenTransactionType } from 'src/apollo/types'
import { areRecipientsEquivalent, Recipient } from 'src/recipients/recipient'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { Actions, ActionTypes } from 'src/send/actions'

// Sets the limit of recent recipients we want to store
const RECENT_RECIPIENTS_TO_STORE = 8

export interface TransactionData {
  recipient: Recipient
  amount: BigNumber
  reason: string
  type: TokenTransactionType
  firebasePendingRequestUid?: string | null
}

export interface ConfirmationInput {
  recipient: Recipient
  amount: BigNumber
  reason: string
  recipientAddress: string | null | undefined
  type: TokenTransactionType
  firebasePendingRequestUid?: string | null
}

export interface SecureSendPhoneNumberMapping {
  [e164Number: string]: {
    address: string | undefined
    addressValidationRequired: boolean
    fullValidationRequired: boolean
  }
}

export interface State {
  isSending: boolean
  recentRecipients: Recipient[]
  isValidRecipient: boolean
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
}

const initialState = {
  isSending: false,
  recentRecipients: [],
  isValidRecipient: false,
  secureSendPhoneNumberMapping: {},
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
      const { secureSendPhoneNumberMapping } = state
      // Overwrite the previous mapping every time a new one is validated
      secureSendPhoneNumberMapping[action.e164Number] = {
        address: action.validatedAddress,
        addressValidationRequired: false,
        fullValidationRequired: false,
      }

      return {
        ...state,
        isValidRecipient: true,
        secureSendPhoneNumberMapping,
      }
    case Actions.VALIDATE_RECIPIENT_ADDRESS_FAILURE:
      return {
        ...state,
        isValidRecipient: false,
      }
    case Actions.SECURE_SEND_REQUIRED:
      const newSecureSendMapping = state.secureSendPhoneNumberMapping
      newSecureSendMapping[action.e164Number] = {
        address: undefined,
        addressValidationRequired: true,
        fullValidationRequired: action.fullValidationRequired,
      }

      return {
        ...state,
        isValidRecipient: false,
        secureSendPhoneNumberMapping: newSecureSendMapping,
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

export const secureSendPhoneNumberMappingSelector = (state: RootState) =>
  state.send.secureSendPhoneNumberMapping
