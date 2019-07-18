import { PaymentRequest } from 'src/account/types'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ERROR_BANNER_DURATION, SUPPORTS_KEYSTORE } from 'src/config'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getPin as getPinCred, setPin as setPinCred } from 'src/pincode/PincodeViaAndroidKeystore'
import { DispatchType, GetStateType } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

const TAG = 'account/actions'

export enum Actions {
  SET_NAME = 'ACCOUNT/SET_NAME',
  SET_PHONE_NUMBER = 'ACCOUNT/SET_PHONE_NUMBER',
  DEV_MODE_TRIGGER_CLICKED = 'ACCOUNT/NAME_CLICKED',
  PHOTOSNUX_CLICKED = 'ACCOUNT/PHOTOSNUX_CLICKED',
  PINCODE_SET = 'ACCOUNT/PINCODE_SET',
  SET_ACCOUNT_CREATION_TIME_ACTION = 'ACCOUNT/SET_ACCOUNT_CREATION_TIME_ACTION',
  SET_BACKUP_COMPLETED_ACTION = 'ACCOUNT/SET_BACKUP_COMPLETED_ACTION',
  UPDATE_PAYMENT_REQUESTS = 'ACCOUNT/UPDATE_PAYMENT_REQUESTS',
  DISMISS_EARN_REWARDS = 'ACCOUNT/DISMISS_EARN_REWARDS',
  DISMISS_INVITE_FRIENDS = 'ACCOUNT/DISMISS_INVITE_FRIENDS',
  SET_USER_CONTACT_DETAILS = 'ACCOUNT/SET_USER_CONTACT_DETAILS',
}

export interface SetNameAction {
  type: Actions.SET_NAME
  name: string
}

export interface SetPhoneNumberAction {
  type: Actions.SET_PHONE_NUMBER
  e164PhoneNumber: string
  countryCode: string
}

export interface DevModeTriggerClickedAction {
  type: Actions.DEV_MODE_TRIGGER_CLICKED
}

export interface PhotosNUXClickedAction {
  type: Actions.PHOTOSNUX_CLICKED
}

export interface PincodeSetAction {
  type: Actions.PINCODE_SET
}

export interface SetAccountCreationAction {
  type: Actions.SET_ACCOUNT_CREATION_TIME_ACTION
}

export interface SetBackupCompletedAction {
  type: Actions.SET_BACKUP_COMPLETED_ACTION
}

export interface UpdatePaymentRequestsAction {
  type: Actions.UPDATE_PAYMENT_REQUESTS
  paymentRequests: PaymentRequest[]
}

export interface DismissEarnRewards {
  type: Actions.DISMISS_EARN_REWARDS
}

export interface DismissInviteFriends {
  type: Actions.DISMISS_INVITE_FRIENDS
}

export interface SetContactDetailsAction {
  type: Actions.SET_USER_CONTACT_DETAILS
  contactId: string
  thumbnailPath: string | null
}

export type ActionTypes =
  | SetNameAction
  | SetPhoneNumberAction
  | DevModeTriggerClickedAction
  | PhotosNUXClickedAction
  | PincodeSetAction
  | SetAccountCreationAction
  | SetBackupCompletedAction
  | UpdatePaymentRequestsAction
  | DismissEarnRewards
  | DismissInviteFriends
  | SetContactDetailsAction

export function setName(name: string): SetNameAction {
  return {
    type: Actions.SET_NAME,
    name,
  }
}

export function setPhoneNumber(e164PhoneNumber: string, countryCode: string): SetPhoneNumberAction {
  CeloAnalytics.track(DefaultEventNames.phoneNumberSet, { countryCode })
  return {
    type: Actions.SET_PHONE_NUMBER,
    e164PhoneNumber,
    countryCode,
  }
}

export const devModeTriggerClicked = (): DevModeTriggerClickedAction => ({
  type: Actions.DEV_MODE_TRIGGER_CLICKED,
})

export const photosNUXCompleted = (): PhotosNUXClickedAction => ({
  type: Actions.PHOTOSNUX_CLICKED,
})

export const pincodeSet = (): PincodeSetAction => ({
  type: Actions.PINCODE_SET,
})

export const setAccountCreationTime = (): SetAccountCreationAction => ({
  type: Actions.SET_ACCOUNT_CREATION_TIME_ACTION,
})

export const setBackupCompleted = (): SetBackupCompletedAction => ({
  type: Actions.SET_BACKUP_COMPLETED_ACTION,
})

export const updatePaymentRequests = (
  paymentRequests: PaymentRequest[]
): UpdatePaymentRequestsAction => ({
  type: Actions.UPDATE_PAYMENT_REQUESTS,
  paymentRequests,
})

export const dismissEarnRewards = (): DismissEarnRewards => ({
  type: Actions.DISMISS_EARN_REWARDS,
})

export const dismissInviteFriends = (): DismissInviteFriends => ({
  type: Actions.DISMISS_INVITE_FRIENDS,
})

export const setUserContactDetails = (
  contactId: string,
  thumbnailPath: string | null
): SetContactDetailsAction => ({
  type: Actions.SET_USER_CONTACT_DETAILS,
  contactId,
  thumbnailPath,
})

export const setPin = (pin: string) => async (dispatch: DispatchType, getState: GetStateType) => {
  let success

  const state = getState()
  if (state.account.pincodeSet) {
    Logger.debug(TAG + '@setPin', 'Pincode has already been set')
    throw Error('Can not set PIN twice')
  }
  if (!pin) {
    Logger.debug(TAG + '@setPin', 'setpin got falsy pin: ' + pin)
    throw Error('Can not set falsy PIN')
  }
  if (SUPPORTS_KEYSTORE) {
    Logger.info(TAG + '@setPin', 'supports keystore')
    try {
      success = await setPinCred(pin)
    } catch (e) {
      Logger.debug(TAG + '@setPin', 'setpin failed with:' + e)
      success = false
    }
    Logger.info(TAG + '@setPin', 'keystore setpin: ' + success)
  }

  if (success) {
    await dispatch(pincodeSet())
    Logger.info(TAG + '@setPin', 'pincode set')
    return true
  } else {
    dispatch(showError(ErrorMessages.SET_PIN_FAILED, ERROR_BANNER_DURATION))
    return false
  }
}

export const getPincode = async () => {
  let pin
  if (SUPPORTS_KEYSTORE) {
    Logger.info(TAG + '@getPincode', 'using keystore')
    pin = await getPinCred()
  } else {
    Logger.debug(TAG + '@getPincode', 'NOT using keystore')
    const pincodeEntered = new Promise((resolve, reject) => {
      navigate(Screens.PincodeConfirmation, { resolve, reject })
    })
    pin = await pincodeEntered
  }

  if (!pin) {
    Logger.debug(TAG + '@getPincode', 'pin seems to be falsy')
    Logger.showMessage(
      'PIN might be corrupted, please get backup key, wipe app data, update the app and recover from backup key'
    )
    return
  } else {
    Logger.debug(TAG + '@getPincode', 'get keystore pincode')
  }
  return pin
}
