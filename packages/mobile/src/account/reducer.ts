import { isE164Number } from '@celo/utils/src/phoneNumbers'
import { Actions, ActionTypes } from 'src/account/actions'
import { DEV_SETTINGS_ACTIVE_INITIALLY } from 'src/config'
import { features } from 'src/flags'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import Logger from 'src/utils/Logger'
import { getRemoteTime } from 'src/utils/time'
import { Actions as Web3Actions, ActionTypes as Web3ActionTypes } from 'src/web3/actions'

export interface State {
  name: string | null
  e164PhoneNumber: string | null
  defaultCountryCode: string | null
  contactDetails: UserContactDetails
  devModeActive: boolean
  devModeClickCount: number
  photosNUXClicked: boolean
  pincodeType: PincodeType
  isSettingPin: boolean
  accountCreationTime: number
  backupCompleted: boolean
  backupDelayedTime: number
  socialBackupCompleted: boolean
  dismissedInviteFriends: boolean
  dismissedGetVerified: boolean
  promptFornoIfNeeded: boolean
  retryVerificationWithForno: boolean
  acceptedTerms: boolean
  hasMigratedToNewBip39: boolean
  choseToRestoreAccount: boolean | undefined
}

export enum PincodeType {
  Unset = 'Unset',
  CustomPin = 'CustomPin',
}

export interface UserContactDetails {
  contactId: string | null
  thumbnailPath: string | null
}

export const initialState = {
  name: null,
  e164PhoneNumber: null,
  defaultCountryCode: null,
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
  backupCompleted: false,
  backupDelayedTime: 0,
  socialBackupCompleted: false,
  dismissedInviteFriends: false,
  dismissedGetVerified: false,
  promptFornoIfNeeded: false,
  acceptedTerms: false,
  retryVerificationWithForno: features.VERIFICATION_FORNO_RETRY,
  hasMigratedToNewBip39: false,
  choseToRestoreAccount: false,
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction | Web3ActionTypes
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      return {
        ...state,
        ...getRehydratePayload(action, 'account'),
        dismissedGetVerified: false,
      }
    }
    case Actions.CHOOSE_CREATE_ACCOUNT:
      return {
        ...state,
        choseToRestoreAccount: false,
      }
    case Actions.CHOOSE_RESTORE_ACCOUNT:
      return {
        ...state,
        choseToRestoreAccount: true,
      }
    case Actions.CANCEL_CREATE_OR_RESTORE_ACCOUNT:
      return {
        ...state,
        choseToRestoreAccount: false,
        pincodeType: PincodeType.Unset,
        isSettingPin: false,
      }
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
      const devModeActive = newClickCount >= 3
      if (devModeActive) {
        Logger.showMessage('Debug Mode Activated')
      }
      return {
        ...state,
        devModeClickCount: newClickCount,
        devModeActive,
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
    case Actions.SET_ACCOUNT_CREATION_TIME:
      return {
        ...state,
        accountCreationTime: getRemoteTime(),
      }
    case Actions.SET_BACKUP_COMPLETED:
      return {
        ...state,
        backupCompleted: true,
      }
    case Actions.SET_BACKUP_DELAYED:
      return {
        ...state,
        backupDelayedTime: getRemoteTime(),
      }
    case Actions.SET_SOCIAL_BACKUP_COMPLETED:
      return {
        ...state,
        socialBackupCompleted: true,
      }
    case Actions.TOGGLE_BACKUP_STATE:
      return {
        ...state,
        backupCompleted: !state.backupCompleted,
        socialBackupCompleted: false,
        backupDelayedTime: 0,
      }
    case Actions.DISMISS_INVITE_FRIENDS:
      return {
        ...state,
        dismissedInviteFriends: true,
      }
    case Actions.DISMISS_GET_VERIFIED:
      return {
        ...state,
        dismissedGetVerified: true,
      }
    case Actions.SET_USER_CONTACT_DETAILS:
      return {
        ...state,
        contactDetails: {
          contactId: action.contactId,
          thumbnailPath: action.thumbnailPath,
        },
      }
    case Actions.SET_PROMPT_FORNO:
      return {
        ...state,
        promptFornoIfNeeded: action.promptIfNeeded,
      }
    case Actions.SET_RETRY_VERIFICATION_WITH_FORNO:
      return {
        ...state,
        retryVerificationWithForno: action.retry,
      }
    case Actions.ACCEPT_TERMS: {
      return { ...state, acceptedTerms: true }
    }
    case Web3Actions.SET_ACCOUNT: {
      return {
        ...state,
        hasMigratedToNewBip39: true,
      }
    }
    default:
      return state
  }
}
