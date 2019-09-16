import AsyncPolling from 'async-polling'
import { getWeb3Instance, makeExchangeQuery } from 'src/exchange/exchangeQuery'
import { handleTransferNotifications } from './blockscout/transfers'
import { EXCHANGE_POLLING_INTERVAL, POLLING_INTERVAL } from './config'
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

export const exchangePolling = AsyncPolling(async (end) => {
  try {
    const web3 = await getWeb3Instance()
    await makeExchangeQuery(web3)
  } catch (e) {
    console.error('Exchange polling failed', e)
  } finally {
    end()
  }
}, EXCHANGE_POLLING_INTERVAL)
