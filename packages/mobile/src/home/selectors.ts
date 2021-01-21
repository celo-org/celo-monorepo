import { getRegionCodeFromCountryCode } from '@celo/utils/src/phoneNumbers'
import _ from 'lodash'
import DeviceInfo from 'react-native-device-info'
import { createSelector } from 'reselect'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import {
  getIncomingPaymentRequests,
  getOutgoingPaymentRequests,
} from 'src/paymentRequest/selectors'
import { RootState } from 'src/redux/reducers'
import { isVersionInRange } from 'src/utils/versionCheck'

// TODO: De-dupe this with NotificationBox
// It's not great that we must edit this and NotificationBox whenever introducing new notifications
export const getActiveNotificationCount = createSelector(
  [
    getIncomingPaymentRequests,
    getOutgoingPaymentRequests,
    getReclaimableEscrowPayments,
    (state) => state.account.backupCompleted,
  ],
  (incomingPaymentReqs, outgoingPaymentRequests, reclaimableEscrowPayments, backupCompleted) => {
    return (
      incomingPaymentReqs.length +
      outgoingPaymentRequests.length +
      reclaimableEscrowPayments.length +
      (backupCompleted ? 0 : 1)
    )
  }
)

export const callToActNotificationSelector = (state: RootState) => {
  return (
    !state.account.backupCompleted ||
    !state.goldToken.educationCompleted ||
    !state.account.dismissedInviteFriends ||
    (!state.app.numberVerified && !state.account.dismissedGetVerified)
  )
}

const homeNotificationsSelector = (state: RootState) => state.home.notifications

export const getExtraNotifications = createSelector(
  [homeNotificationsSelector, defaultCountryCodeSelector],
  (notifications, countryCallingCode) => {
    const version = DeviceInfo.getVersion()
    const countryCodeAlpha2 = countryCallingCode
      ? getRegionCodeFromCountryCode(countryCallingCode)
      : null
    return _.pickBy(notifications, (notification) => {
      return (
        !!notification &&
        !notification.dismissed &&
        isVersionInRange(version, notification.minVersion, notification.maxVersion) &&
        (notification.countries?.length
          ? !!countryCodeAlpha2 && notification.countries.includes(countryCodeAlpha2)
          : true)
      )
    })
  }
)
