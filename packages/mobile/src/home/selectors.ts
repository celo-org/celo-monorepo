import { createSelector } from 'reselect'
import { getPaymentRequests } from 'src/account/selectors'
import { RootState } from 'src/redux/reducers'
import { isBackupTooLate } from 'src/redux/selectors'

export const getActiveNotificationCount = createSelector(
  [getPaymentRequests, isBackupTooLate],
  (paymentRequests, backupTooLate) => {
    const activeNotifications = backupTooLate ? paymentRequests.length + 1 : paymentRequests.length

    return activeNotifications
  }
)

export const callToActNotificationSelector = (state: RootState) => {
  return (
    !state.account.backupCompleted ||
    !state.goldToken.educationCompleted ||
    !state.account.dismissedEarnRewards ||
    !state.account.dismissedInviteFriends
  )
}
