export enum actions {
  SET_NAME = 'APP/SET_NAME',
  SET_E164_NUMBER = 'APP/SET_E164_NUMBER',
  SET_ACCOUNT_ADDRESS = 'APP/SET_ACCOUNT_ADDRESS',
  SET_TOTAL_EARNINGS = 'APP/SET_TOTAL_EARNINGS',
  SET_TOTAL_MESSAGES = 'APP/SET_TOTAL_MESSAGES',
  SET_LANGUAGE = 'APP/SET_LANGUAGE',
  SET_EDUCATION_COMPLETED = 'APP/SET_EDUCATION_COMPLETED',
  SHOW_ERROR = 'APP/SHOW_ERROR',
  CLEAR_ERROR = 'APP/CLEAR_ERROR',
  SHOW_MESSAGE = 'APP/SHOW_MESSAGE',
  CLEAR_MESSAGE = 'APP/CLEAR_MESSAGE',
  SET_VERIFICATION_STATE = 'APP/SET_VERIFICATION_STATE',
  SET_MESSAGE_PHONE_MAPPING = 'APP/SET_MESSAGE_PHONE_MAPPING',
  SET_COUNTRY_CODE = 'APP/SET_COUNTRY_CODE',
}

export enum errorMessages {
  SMS_PERMISSION_IS_NEEDED = 'smsPermissionIsNeeded',
  PHONE_NUMBER_IS_INVALID = 'phoneNumberIsInvalid',
}

export interface MessagePhoneMapping {
  [address: string]: string
}

export interface SetNameAction {
  type: actions.SET_NAME
  name: string
}

export interface SetE164NumberAction {
  type: actions.SET_E164_NUMBER
  e164Number: string
}

export interface SetCountryCodeAction {
  type: actions.SET_COUNTRY_CODE
  countryCode: string
}

export interface SetAccountAddressAction {
  type: actions.SET_ACCOUNT_ADDRESS
  accountAddress: string
}

export interface SetTotalEarningsAction {
  type: actions.SET_TOTAL_EARNINGS
  totalEarnings: number
}

export interface SetTotalMessagesAction {
  type: actions.SET_TOTAL_MESSAGES
  totalMessages: number
}

export interface SetLanguageAction {
  type: actions.SET_LANGUAGE
  language: string
}

export interface SetEducationCompletedAction {
  type: actions.SET_EDUCATION_COMPLETED
}

export interface ShowErrorAction {
  type: actions.SHOW_ERROR
  error: errorMessages
  dismissErrorAfter: number | null
}

export interface ClearErrorAction {
  type: actions.CLEAR_ERROR
}

export interface SetVerificationStateAction {
  type: actions.SET_VERIFICATION_STATE
  isVerifying: boolean
  verifyingOffAt: number | null
}

export interface ShowMessageAction {
  type: actions.SHOW_MESSAGE
  message: string
  title?: string | null
  dismissMessageAfter: number | null
}

export interface ClearMessageAction {
  type: actions.CLEAR_MESSAGE
}

export interface SetMessagePhoneMap {
  type: actions.SET_MESSAGE_PHONE_MAPPING
  messagePhoneMapping: MessagePhoneMapping
}

export type ActionTypes =
  | SetNameAction
  | SetE164NumberAction
  | SetAccountAddressAction
  | SetTotalEarningsAction
  | SetTotalMessagesAction
  | SetLanguageAction
  | SetEducationCompletedAction
  | ShowMessageAction
  | ClearMessageAction
  | ShowErrorAction
  | ClearErrorAction
  | SetVerificationStateAction
  | SetMessagePhoneMap
  | SetCountryCodeAction

export interface State {
  name: string | null
  e164Number: string | null
  countryCode: string | null
  accountAddress: string | null
  totalEarnings: number
  totalMessages: number
  language: string | null
  educationCompleted: boolean
  error: errorMessages | null
  dismissErrorAfter: number | null
  message: string | null
  bannerTitle: string | null
  dismissMessageAfter: number | null
  verifyingOffAt: number | null
  isVerifying: boolean
  messagePhoneMapping: MessagePhoneMapping
}

export const initialState = {
  name: null,
  e164Number: null,
  countryCode: null,
  accountAddress: null,
  totalEarnings: 0,
  totalMessages: 0,
  language: null,
  educationCompleted: false,
  error: null,
  dismissErrorAfter: null,
  message: null,
  bannerTitle: null,
  dismissMessageAfter: null,
  verifyingOffAt: null,
  isVerifying: false,
  messagePhoneMapping: {},
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case actions.SET_NAME:
      return {
        ...state,
        name: action.name,
      }
    case actions.SET_E164_NUMBER:
      return {
        ...state,
        e164Number: action.e164Number,
      }
    case actions.SET_COUNTRY_CODE:
      return {
        ...state,
        countryCode: action.countryCode,
      }
    case actions.SET_ACCOUNT_ADDRESS:
      return {
        ...state,
        accountAddress: action.accountAddress,
      }
    case actions.SET_TOTAL_EARNINGS:
      return {
        ...state,
        totalEarnings: action.totalEarnings,
      }
    case actions.SET_TOTAL_MESSAGES:
      return {
        ...state,
        totalMessages: action.totalMessages,
      }
    case actions.SET_LANGUAGE:
      return {
        ...state,
        language: action.language,
      }
    case actions.SET_EDUCATION_COMPLETED:
      return {
        ...state,
        educationCompleted: true,
      }
    case actions.SHOW_ERROR:
      return {
        ...state,
        error: action.error,
        dismissErrorAfter: action.dismissErrorAfter,
      }
    case actions.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      }
    case actions.SHOW_MESSAGE:
      return {
        ...state,
        message: action.message,
        bannerTitle: action.title || null,
        dismissMessageAfter: action.dismissMessageAfter,
      }
    case actions.CLEAR_MESSAGE:
      return {
        ...state,
        message: null,
        bannerTitle: null,
      }
    case actions.SET_VERIFICATION_STATE:
      const newState = !action.isVerifying ? { verifyingOffAt: action.verifyingOffAt } : {}
      return {
        ...state,
        ...newState,
        isVerifying: action.isVerifying,
      }
    case actions.SET_MESSAGE_PHONE_MAPPING:
      return {
        ...state,
        messagePhoneMapping: action.messagePhoneMapping,
      }
    default:
      return state
  }
}
