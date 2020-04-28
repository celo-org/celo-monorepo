import { PaymentInfo } from 'src/send/reducers'
import { isPaymentLimitReached } from 'src/send/utils'

describe('send/utils', () => {
  describe('isPaymentLimitReached', () => {
    const HOURS = 3600 * 1000

    it('no recent payments, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = []
      expect(isPaymentLimitReached(now, recentPayments, newPayment)).toBeFalsy()
    })

    it('no recent payments, large transaction, fine', () => {
      const now = Date.now()
      const newPayment = 500
      const recentPayments: PaymentInfo[] = []
      expect(isPaymentLimitReached(now, recentPayments, newPayment)).toBeFalsy()
    })

    it('no recent payments, too large transaction', () => {
      const now = Date.now()
      const newPayment = 501
      const recentPayments: PaymentInfo[] = []
      expect(isPaymentLimitReached(now, recentPayments, newPayment)).toBeTruthy()
    })

    it('one recent payment, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [{ timestamp: now, amount: 10 }]
      expect(isPaymentLimitReached(now, recentPayments, newPayment)).toBeFalsy()
    })

    it('multiple recent payments, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [
        { timestamp: now - 2 * HOURS, amount: 200 },
        { timestamp: now - 3 * HOURS, amount: 200 },
      ]
      expect(isPaymentLimitReached(now, recentPayments, newPayment)).toBeFalsy()
    })

    it('one large recent payment, more than 24 hours ago, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [{ timestamp: now - 25 * HOURS, amount: 500 }]
      expect(isPaymentLimitReached(now, recentPayments, newPayment)).toBeFalsy()
    })

    it('multiple recent payments, over limit, more than 24 hours ago, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [
        { timestamp: now - 48 * HOURS, amount: 300 },
        { timestamp: now - 24 * HOURS, amount: 300 },
      ]
      expect(isPaymentLimitReached(now, recentPayments, newPayment)).toBeFalsy()
    })

    it('multiple recent payments, over limit', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [
        { timestamp: now - 12 * HOURS, amount: 250 },
        { timestamp: now - 6 * HOURS, amount: 250 },
      ]
      expect(isPaymentLimitReached(now, recentPayments, newPayment)).toBeTruthy()
    })
  })
})
