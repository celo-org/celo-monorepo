import {
  getPendingRequests,
  requestedPaymentNotification,
  setPaymentRequestNotified,
} from './firebase'

export async function handlePaymentRequests() {
  console.debug('Checking payment requests....')
  const allPendingRequests = getPendingRequests()
  if (!allPendingRequests) {
    console.debug('No pending payment requests')
    return
  }
  const keys = Object.keys(allPendingRequests)
  console.debug(`Found ${keys.length} pending payment requests`)
  for (const uid of keys) {
    const request = allPendingRequests[uid]
    if (request.notified) {
      continue
    }
    await setPaymentRequestNotified(uid)
    await requestedPaymentNotification(
      request.requesteeAddress,
      request.amount,
      request.currency,
      request
    )
  }
}
