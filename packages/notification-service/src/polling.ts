import AsyncPolling from 'async-polling'
import { handleTransferNotifications } from './blockscout/transfers'
import { POLLING_INTERVAL } from './config'
import { handlePaymentRequests } from './handlers'

export const notificationPolling = AsyncPolling(async (end) => {
  try {
    await handleTransferNotifications()
    await handlePaymentRequests()
  } catch (e) {
    console.error('Notifications polling failed', e)
  } finally {
    end()
  }
}, POLLING_INTERVAL)
