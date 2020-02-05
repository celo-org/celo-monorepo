import { createSelector } from 'reselect'
import { getIncomingPaymentRequests, getOutgoingPaymentRequests } from 'src/account/selectors'
import { PROMOTE_REWARDS_APP } from 'src/config'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import { RootState } from 'src/redux/reducers'
import { isBackupTooLate } from 'src/redux/selectors'

// TODO: De-dupe this with NotificationBox
// It's not great that we must edit this and NotificationBox whenever introducing new notifications
export const getActiveNotificationCount = createSelector(
  [
    getIncomingPaymentRequests,
    getOutgoingPaymentRequests,
    getReclaimableEscrowPayments,
    isBackupTooLate,
  ],
  (incomingPaymentReqs, outgoingPaymentRequests, reclaimableEscrowPayments, backupTooLate) => {
    return (
      incomingPaymentReqs.length +
      outgoingPaymentRequests.length +
      reclaimableEscrowPayments.length +
      (backupTooLate ? 1 : 0)
    )
  }
)

export const callToActNotificationSelector = (state: RootState) => {
  return (
    !state.account.backupCompleted ||
    !state.goldToken.educationCompleted ||
    (!state.account.dismissedEarnRewards && PROMOTE_REWARDS_APP) ||
    !state.account.dismissedInviteFriends ||
    (!state.app.numberVerified && !state.account.dismissedGetVerified)
  )
}
