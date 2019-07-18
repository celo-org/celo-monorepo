import { isE164Number } from '@celo/utils/src/phoneNumbers'
import { AsyncStorage } from 'react-native'
import { Actions, ActionTypes } from 'src/account/actions'
import { PaymentRequest } from 'src/account/types'
import { DEV_SETTINGS_ACTIVE_INITIALLY } from 'src/config'
import { RootState } from 'src/redux/reducers'
import { getRemoteTime } from 'src/utils/time'

export interface State {
  name: string
  e164PhoneNumber: string
  defaultCountryCode: string
  contactDetails: UserContactDetails
  devModeActive: boolean
  devModeClickCount: number
  photosNUXClicked: boolean
  pincodeSet: boolean
  accountCreationTime: number
  backupCompleted: boolean
  paymentRequests: PaymentRequest[]
  dismissedEarnRewards: boolean
  dismissedInviteFriends: boolean
}

export interface UserContactDetails {
  contactId: string | null
  thumbnailPath: string | null
}

export const initialState = {
  name: '',
  e164PhoneNumber: '',
  defaultCountryCode: '',
  contactDetails: {
    contactId: null,
    thumbnailPath: null,
  },
  devModeActive: DEV_SETTINGS_ACTIVE_INITIALLY,
  devModeClickCount: 0,
  photosNUXClicked: false,
  pincodeSet: false,
  accountCreationTime: 99999999999999,
  paymentRequests: [],
  backupCompleted: false,
  dismissedEarnRewards: false,
  dismissedInviteFriends: false,
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.SET_NAME:
      return {
        ...state,
        name: action.name,
      }
    case Actions.SET_PHONE_NUMBER:
      if (!isE164Number(action.e164PhoneNumber)) {
        return state
      }
      return {
        ...state,
        e164PhoneNumber: action.e164PhoneNumber,
        defaultCountryCode: action.countryCode,
      }
    case Actions.DEV_MODE_TRIGGER_CLICKED:
      const newClickCount = (state.devModeClickCount + 1) % 10
      return {
        ...state,
        devModeClickCount: newClickCount,
        devModeActive: newClickCount >= 5,
      }
    case Actions.PHOTOSNUX_CLICKED:
      return {
        ...state,
        photosNUXClicked: true,
      }
    case Actions.PINCODE_SET:
      return {
        ...state,
        pincodeSet: true,
      }
    case Actions.SET_ACCOUNT_CREATION_TIME_ACTION:
      return {
        ...state,
        accountCreationTime: getRemoteTime(),
      }
    case Actions.SET_BACKUP_COMPLETED_ACTION:
      AsyncStorage.removeItem('mnemonic') // remove the backup key from storage
      return {
        ...state,
        backupCompleted: true,
      }
    case Actions.UPDATE_PAYMENT_REQUESTS:
      return {
        ...state,
        paymentRequests: action.paymentRequests,
      }
    case Actions.DISMISS_EARN_REWARDS:
      return {
        ...state,
        dismissedEarnRewards: true,
      }
    case Actions.DISMISS_INVITE_FRIENDS:
      return {
        ...state,
        dismissedInviteFriends: true,
      }
    case Actions.SET_USER_CONTACT_DETAILS:
      return {
        ...state,
        contactDetails: {
          contactId: action.contactId,
          thumbnailPath: action.thumbnailPath,
        },
      }
    default:
      return state
  }
}

export const devModeSelector = (state: RootState) => state.account.devModeActive
export const e164NumberSelector = (state: RootState) => state.account.e164PhoneNumber
export const defaultCountryCodeSelector = (state: RootState) => state.account.defaultCountryCode
export const getUserContactDetails = (state: RootState) => state.account.contactDetails
export const pincodeSelector = (state: RootState) => state.account.pincodeSet
