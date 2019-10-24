import AsyncPolling from 'async-polling'
import { handleTransferNotifications } from './blockscout/transfers'
import {
  FIAT_EXCHANGE_POLLING_INTERVAL,
  GOLD_EXCHANGE_POLLING_INTERVAL,
  POLLING_INTERVAL,
} from './config'
import { handleFiatExchangeQuery } from './currency/currencyQuery'
import { handleGoldExchangeQuery } from './exchange/exchangeQuery'
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

export const goldExchangePolling = AsyncPolling(async (end) => {
  try {
    await handleGoldExchangeQuery()
  } catch (e) {
    console.error('Gold exchange polling failed', e)
  } finally {
    end()
  }
}, GOLD_EXCHANGE_POLLING_INTERVAL)

export const fiatExchangePolling = AsyncPolling(async (end) => {
  try {
    await handleFiatExchangeQuery()
  } catch (e) {
    console.error('Fiat exchange polling failed', e)
  } finally {
    end()
  }
}, FIAT_EXCHANGE_POLLING_INTERVAL)
