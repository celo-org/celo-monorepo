import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { UriData, urlFromUriData } from 'src/qrcode/schema'
import { PaymentInfo } from 'src/send/reducers'
import {
  dailyAmountRemaining,
  handlePaymentDeeplink,
  // The formatter contradicts the linter :(
  // tslint:disable-next-line: ordered-imports
  handleSendPaymentData,
  _isPaymentLimitReached,
} from 'src/send/utils'

describe('send/utils', () => {
  const HOURS = 3600 * 1000
  describe('isPaymentLimitReached', () => {
    it('no recent payments, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = []
      expect(_isPaymentLimitReached(now, recentPayments, newPayment)).toBeFalsy()
    })

    it('no recent payments, large transaction, fine', () => {
      const now = Date.now()
      const newPayment = 500
      const recentPayments: PaymentInfo[] = []
      expect(_isPaymentLimitReached(now, recentPayments, newPayment)).toBeFalsy()
    })

    it('no recent payments, too large transaction', () => {
      const now = Date.now()
      const newPayment = 501
      const recentPayments: PaymentInfo[] = []
      expect(_isPaymentLimitReached(now, recentPayments, newPayment)).toBeTruthy()
    })

    it('one recent payment, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [{ timestamp: now, amount: 10 }]
      expect(_isPaymentLimitReached(now, recentPayments, newPayment)).toBeFalsy()
    })

    it('multiple recent payments, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [
        { timestamp: now - 2 * HOURS, amount: 200 },
        { timestamp: now - 3 * HOURS, amount: 200 },
      ]
      expect(_isPaymentLimitReached(now, recentPayments, newPayment)).toBeFalsy()
    })

    it('one large recent payment, more than 24 hours ago, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [{ timestamp: now - 25 * HOURS, amount: 500 }]
      expect(_isPaymentLimitReached(now, recentPayments, newPayment)).toBeFalsy()
    })

    it('multiple recent payments, over limit, more than 24 hours ago, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [
        { timestamp: now - 48 * HOURS, amount: 300 },
        { timestamp: now - 24 * HOURS, amount: 300 },
      ]
      expect(_isPaymentLimitReached(now, recentPayments, newPayment)).toBeFalsy()
    })

    it('multiple recent payments, over limit', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [
        { timestamp: now - 12 * HOURS, amount: 250 },
        { timestamp: now - 6 * HOURS, amount: 250 },
      ]
      expect(_isPaymentLimitReached(now, recentPayments, newPayment)).toBeTruthy()
    })
  })
  describe('dailyAmountRemaining', () => {
    it('returns difference between amount sent in last 24 hours and the Limit', () => {
      const now = Date.now()
      const recentPayments: PaymentInfo[] = [{ timestamp: now, amount: 10 }]
      expect(dailyAmountRemaining(now, recentPayments)).toEqual(490)
    })

    it('returns 0 when limit has been reached', () => {
      const now = Date.now()
      const recentPayments: PaymentInfo[] = [
        { timestamp: now, amount: 100 },
        { timestamp: now, amount: 200 },
        { timestamp: now, amount: 200 },
      ]
      expect(dailyAmountRemaining(now, recentPayments)).toEqual(0)
    })

    it('works fine when no payments have been sent', () => {
      const now = Date.now()
      const recentPayments: PaymentInfo[] = []
      expect(dailyAmountRemaining(now, recentPayments)).toEqual(500)
    })

    it('works fine when payments were sent but some more than 24 hours ago', () => {
      const now = Date.now()
      const recentPayments: PaymentInfo[] = [
        { timestamp: now - 48 * HOURS, amount: 300 },
        { timestamp: now - 16 * HOURS, amount: 300 },
      ]
      expect(dailyAmountRemaining(now, recentPayments)).toEqual(200)
    })
  })

  describe('paymentDeepLinks', () => {
    const data = {
      address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
      displayName: 'Super 8',
      currencyCode: 'PHP' as LocalCurrencyCode,
      amount: '500',
      comment: '92a53156-c0f2-11ea-b3de-0242ac13000',
    }

    const deeplink = urlFromUriData(data)

    it('should call handleSendPaymentData with parsed payment data ', async () => {
      const parsed: UriData = {
        ...data,
        e164PhoneNumber: undefined,
      }
      await expectSaga(handlePaymentDeeplink, deeplink)
        .provide([[matchers.call.fn(handleSendPaymentData), parsed]])
        .run()
    })
  })
})
