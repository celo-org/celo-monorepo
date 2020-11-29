import { createSelector } from 'reselect'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import {
  getIncomingPaymentRequests,
  getOutgoingPaymentRequests,
} from 'src/paymentRequest/selectors'
import { RootState } from 'src/redux/reducers'

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
