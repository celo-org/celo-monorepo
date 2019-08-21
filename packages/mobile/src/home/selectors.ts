import { createSelector } from 'reselect'
import { getPaymentRequests } from 'src/account/selectors'
import { PROMOTE_REWARDS_APP } from 'src/config'
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
    (!state.account.dismissedEarnRewards && PROMOTE_REWARDS_APP) ||
    !state.account.dismissedInviteFriends
  )
}
