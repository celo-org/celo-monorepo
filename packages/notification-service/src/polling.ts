import AsyncPolling from 'async-polling'
import { handlePaymentRequests } from 'src/handlers'
import { handleTransferNotifications } from './blockscout/transfers'
import { EXCHANGE_POLLING_INTERVAL, POLLING_INTERVAL } from './config'
import { handleExchangeQuery } from './exchange/exchangeQuery'

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

export const exchangePolling = AsyncPolling(async (end) => {
  try {
    await handleExchangeQuery()
  } catch (e) {
    console.error('Exchange polling failed', e)
  } finally {
    end()
  }
}, EXCHANGE_POLLING_INTERVAL)
