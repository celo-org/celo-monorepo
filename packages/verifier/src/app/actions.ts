import {
  actions,
  ClearErrorAction,
  ClearMessageAction,
  errorMessages,
  MessagePhoneMapping,
  SetAccountAddressAction,
  SetCountryCodeAction,
  SetE164NumberAction,
  SetEducationCompletedAction,
  SetLanguageAction,
  SetMessagePhoneMap,
  SetNameAction,
  SetTotalEarningsAction,
  SetTotalMessagesAction,
  SetVerificationStateAction,
  ShowErrorAction,
  ShowMessageAction,
} from 'src/app/reducer'
import { store } from 'src/redux/store'
import VerifierService from 'src/services/VerifierService'

export const setName = (name: string): SetNameAction => ({
  type: actions.SET_NAME,
  name,
})

export const setE164Number = (e164Number: string): SetE164NumberAction => ({
  type: actions.SET_E164_NUMBER,
  e164Number,
})

export const setCountryCode = (countryCode: string): SetCountryCodeAction => ({
  type: actions.SET_COUNTRY_CODE,
  countryCode,
})

export const setAccountAddress = (accountAddress: string): SetAccountAddressAction => ({
  type: actions.SET_ACCOUNT_ADDRESS,
  accountAddress,
})

export const setTotalEarnings = (totalEarnings: number): SetTotalEarningsAction => ({
  type: actions.SET_TOTAL_EARNINGS,
  totalEarnings,
})

export const setTotalMessages = (totalMessages: number): SetTotalMessagesAction => ({
  type: actions.SET_TOTAL_MESSAGES,
  totalMessages,
})

export const setLanguage = (language: string): SetLanguageAction => ({
  type: actions.SET_LANGUAGE,
  language,
})

export const setVerificationState = (
  isVerifying: boolean,
  verifyingOffAt: number = Date.now()
): SetVerificationStateAction => ({
  type: actions.SET_VERIFICATION_STATE,
  isVerifying,
  verifyingOffAt,
})

export const setEducationCompleted = (): SetEducationCompletedAction => ({
  type: actions.SET_EDUCATION_COMPLETED,
})

export const showError = (
  error: errorMessages,
  dismissErrorAfter: number | null = null
): ShowErrorAction => {
  return {
    type: actions.SHOW_ERROR,
    error,
    dismissErrorAfter,
  }
}

export const clearError = (): ClearErrorAction => {
  return {
    type: actions.CLEAR_ERROR,
  }
}

export const showMessage = (
  message: string,
  dismissMessageAfter: number | null = null,
  title?: string | null
): ShowMessageAction => {
  return {
    type: actions.SHOW_MESSAGE,
    message,
    title,
    dismissMessageAfter,
  }
}

export const clearMessage = (): ClearMessageAction => ({
  type: actions.CLEAR_MESSAGE,
})

export const setMessagePhoneMapping = (
  messagePhoneMapping: MessagePhoneMapping
): SetMessagePhoneMap => ({
  type: actions.SET_MESSAGE_PHONE_MAPPING,
  messagePhoneMapping,
})

export const createMessagePhoneMapping = async () => {
  const smsLogs = await VerifierService.getSMSSendLogs()
  const messagePhoneMapping: MessagePhoneMapping = {}
  for (const log of smsLogs) {
    messagePhoneMapping[log.messageId] = log.PhoneNumber
  }
  store.dispatch(setMessagePhoneMapping(messagePhoneMapping))
}
