import { CURRENCY_ENUM } from '@celo/utils'
import * as admin from 'firebase-admin'
import i18next from 'i18next'
import { Currencies } from './blockscout/transfers'
import { NOTIFICATIONS_DISABLED, NOTIFICATIONS_TTL_MS, NotificationTypes } from './config'

let database: admin.database.Database
let registrationsRef: admin.database.Reference
let lastBlockRef: admin.database.Reference
let pendingRequestsRef: admin.database.Reference
let exchangeRatesRef: admin.database.Reference

export interface Registrations {
  [address: string]:
    | {
        fcmToken: string
        language?: string
      }
    | undefined
    | null
}

export enum PaymentRequestStatuses {
  REQUESTED = 'REQUESTED',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
}

interface PaymentRequest {
  amount: string
  timestamp: string
  requesterE164Number: string
  requesterAddress: string
  requesteeAddress: string
  currency: Currencies
  comment: string
  status: PaymentRequestStatuses
  notified: boolean
  type: NotificationTypes.PAYMENT_REQUESTED
}

interface PendingRequests {
  [uid: string]: PaymentRequest
}

interface ExchangeRateObject {
  makerToken: CURRENCY_ENUM
  exchangeRate: string
  timestamp: string
}

let registrations: Registrations = {}
let lastBlockNotified: number = -1
let pendingRequests: PendingRequests = {}

export function _setTestRegistrations(testRegistrations: Registrations) {
  registrations = testRegistrations
}

function paymentObjectToNotification(po: PaymentRequest): { [key: string]: string } {
  return {
    amount: po.amount,
    timestamp: po.timestamp,
    requesterE164Number: po.requesterE164Number,
    requesterAddress: po.requesterAddress,
    requesteeAddress: po.requesteeAddress,
    currency: po.currency,
    comment: po.comment,
    status: po.status,
    type: po.type,
  }
}

export function initializeDb() {
  database = admin.database()
  registrationsRef = database.ref('/registrations')
  lastBlockRef = database.ref('/lastBlockNotified')
  pendingRequestsRef = database.ref('/pendingRequests')
  exchangeRatesRef = database.ref('/exchangeRates')

  // Attach to the registration ref to keep local registrations mapping up to date
  registrationsRef.on(
    'value',
    (snapshot) => {
      console.debug('Registration data updated')
      registrations = (snapshot && snapshot.val()) || {}
      console.debug('Total registrations found:', Object.keys(registrations).length)
    },
    (errorObject: any) => {
      console.error('Registration data read failed:', errorObject.code)
    }
  )

  lastBlockRef.on(
    'value',
    (snapshot) => {
      console.debug('Latest block data updated: ', snapshot && snapshot.val())
      lastBlockNotified = (snapshot && snapshot.val()) || 0
    },
    (errorObject: any) => {
      console.error('Latest block data read failed:', errorObject.code)
    }
  )

  pendingRequestsRef.on(
    'value',
    (snapshot) => {
      console.debug('Latest payment requests data updated: ', snapshot && snapshot.val())
      pendingRequests = (snapshot && snapshot.val()) || {}
    },
    (errorObject: any) => {
      console.error('Latest payment requests data read failed:', errorObject.code)
    }
  )
}

export function getTokenFromAddress(address: string) {
  const registration = registrations[address]
  if (registration) {
    return registration.fcmToken
  } else {
    return null
  }
}

export function getTranslatorForAddress(address: string) {
  const registration = registrations[address]
  const language = registration && registration.language
  // Language is set and i18next has the proper config
  if (language) {
    console.info(`Language resolved as ${language} for user address ${address}`)
    return i18next.getFixedT(language)
  }
  // If language is not supported falls back to env.DEFAULT_LOCALE
  console.info(`Users ${address} language is not set, valid or supported`)
  return i18next.t.bind(i18next)
}

export function getLastBlockNotified() {
  return lastBlockNotified
}

export function getPendingRequests() {
  return pendingRequests
}

export function setPaymentRequestNotified(uid: string): Promise<void> {
  return database.ref(`/pendingRequests/${uid}`).update({ notified: true })
}

export function writeExchangeRatePair(
  makerToken: CURRENCY_ENUM,
  exchangeRate: string,
  timestamp: string
) {
  const exchangeRateRecord: ExchangeRateObject = { makerToken, exchangeRate, timestamp }
  exchangeRatesRef.push(exchangeRateRecord)
  console.debug('Recorded exchange rate ', exchangeRateRecord)
}

export function setLastBlockNotified(newBlock: number): Promise<void> | undefined {
  if (newBlock <= lastBlockNotified) {
    console.debug('Block number less than latest, skipping latestBlock update.')
    return
  }

  console.debug('Updating last block notified to:', newBlock)
  // Although firebase will keep our local lastBlockNotified in sync with the DB,
  // we set it here ourselves to avoid race condition where we check for notifications
  // again before it syncs
  lastBlockNotified = newBlock
  return lastBlockRef.set(newBlock)
}

export async function sendPaymentNotification(
  address: string,
  amount: string,
  currency: Currencies,
  data: { [key: string]: string }
) {
  const t = getTranslatorForAddress(address)
  data.type = NotificationTypes.PAYMENT_RECEIVED
  return sendNotification(
    t('paymentReceivedTitle'),
    t('paymentReceivedBody', {
      amount,
      currency: t(currency, { count: parseInt(amount, 10) }),
    }),
    address,
    data
  )
}

export async function requestedPaymentNotification(
  address: string,
  amount: string,
  currency: Currencies,
  data: PaymentRequest
) {
  const t = getTranslatorForAddress(address)
  data.type = NotificationTypes.PAYMENT_REQUESTED
  return sendNotification(
    t('paymentRequestedTitle'),
    t('paymentRequestedBody', {
      amount,
      currency: t(currency, { count: parseInt(amount, 10) }),
    }),
    address,
    paymentObjectToNotification(data)
  )
}

export async function sendNotification(
  title: string,
  body: string,
  address: string,
  data: { [key: string]: string }
) {
  const token = getTokenFromAddress(address)
  if (!token) {
    console.info('FCM token missing for address:', address)
    return
  }

  const message: admin.messaging.Message = {
    notification: {
      title,
      body,
    },
    android: {
      ttl: NOTIFICATIONS_TTL_MS,
      priority: 'high',
      notification: {
        icon: 'ic_stat_rings',
        color: '#42D689',
      },
    },
    data,
    token,
  }

  try {
    console.info('Sending notification to:', address)
    const response = await admin.messaging().send(message, NOTIFICATIONS_DISABLED)
    console.info('Successfully sent notification for :', address, response)
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}
