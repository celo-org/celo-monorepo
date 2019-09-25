import { isE164Number } from '@celo/utils/src/phoneNumbers'
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
  pincodeType: PincodeType
  isSettingPin: boolean
  accountCreationTime: number
  backupCompleted: boolean
  backupDelayedTime: number
  paymentRequests: PaymentRequest[]
  dismissedEarnRewards: boolean
  dismissedInviteFriends: boolean
}

export enum PincodeType {
  Unset = 'Unset',
  PhoneAuth = 'PhoneAuth',
  CustomPin = 'CustomPin',
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
  pincodeType: PincodeType.Unset,
  isSettingPin: false,
  accountCreationTime: 99999999999999,
  paymentRequests: [],
  backupCompleted: false,
  backupDelayedTime: 0,
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
      const newClickCount = (state.devModeClickCount + 1) % 6
      return {
        ...state,
        devModeClickCount: newClickCount,
        devModeActive: newClickCount >= 3,
      }
    case Actions.PHOTOSNUX_CLICKED:
      return {
        ...state,
        photosNUXClicked: true,
      }
    case Actions.SET_PINCODE:
      return {
        ...state,
        isSettingPin: true,
      }
    case Actions.SET_PINCODE_SUCCESS:
      return {
        ...state,
        pincodeType: action.pincodeType,
        isSettingPin: false,
      }
    case Actions.SET_PINCODE_FAILURE:
      return {
        ...state,
        pincodeType: PincodeType.Unset,
        isSettingPin: false,
      }
    case Actions.SET_ACCOUNT_CREATION_TIME_ACTION:
      return {
        ...state,
        accountCreationTime: getRemoteTime(),
      }
    case Actions.SET_BACKUP_COMPLETED_ACTION:
      return {
        ...state,
        backupCompleted: true,
      }
    case Actions.SET_BACKUP_DELAYED_ACTION:
      return {
        ...state,
        backupDelayedTime: getRemoteTime(),
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
export const nameSelector = (state: RootState) => state.account.name
export const e164NumberSelector = (state: RootState) => state.account.e164PhoneNumber
export const defaultCountryCodeSelector = (state: RootState) => state.account.defaultCountryCode
export const userContactDetailsSelector = (state: RootState) => state.account.contactDetails
export const pincodeTypeSelector = (state: RootState) => state.account.pincodeType
