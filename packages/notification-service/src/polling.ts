import AsyncPolling from 'async-polling'
// import { handleTransferNotifications } from './blockscout/transfers'
import { POLLING_INTERVAL } from './config'
import { handlePaymentRequests } from './handlers'

export const notificationPolling = AsyncPolling(async (end) => {
  // await handleTransferNotifications()
  await handlePaymentRequests()
  end()
}, POLLING_INTERVAL)
