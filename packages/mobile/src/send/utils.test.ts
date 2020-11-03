import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { TokenTransactionType } from 'src/apollo/types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { fetchExchangeRate } from 'src/localCurrency/saga'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { UriData, urlFromUriData } from 'src/qrcode/schema'
import { PaymentInfo } from 'src/send/reducers'
import { TransactionDataInput } from 'src/send/SendAmount'
import {
  dailyAmountRemaining,
  handlePaymentDeeplink,
  // The formatter contradicts the linter :(
  // tslint:disable-next-line: ordered-imports
  handleSendPaymentData,
  _isPaymentLimitReached,
} from 'src/send/utils'
import { mockQRCodeRecipient, mockUriData } from 'test/values'

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
        token: undefined,
      }
      await expectSaga(handlePaymentDeeplink, deeplink)
        .provide([[matchers.call.fn(handleSendPaymentData), parsed]])
        .run()
    })

    describe('deeplinks for sending cUSD', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })

      it('should navigate to SendAmount screen when address & currencyCode are given ', async () => {
        await expectSaga(handleSendPaymentData, mockUriData[3])
          .provide([[matchers.call.fn(fetchExchangeRate), mockUriData[3].currencyCode]])
          .run()
        expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
          recipient: mockQRCodeRecipient,
          isFromScan: true,
          isOutgoingPaymentRequest: undefined,
        })
      })

      it('should navigate to SendConfirmation screen when address, currencyCode, & amount are given ', async () => {
        const mockTransactionData: TransactionDataInput = {
          recipient: mockQRCodeRecipient,
          amount: new BigNumber('.5'),
          reason: mockUriData[4].comment,
          type: TokenTransactionType.PayPrefill,
        }

        await expectSaga(handleSendPaymentData, mockUriData[4])
          .provide([[matchers.call.fn(fetchExchangeRate), '2']])
          .run()
        expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
          transactionData: mockTransactionData,
          isFromScan: true,
          currencyInfo: { localCurrencyCode: mockUriData[4].currencyCode, localExchangeRate: '2' },
        })
      })

      it('should navigate to SendConfirmation screen when address, currencyCode, amount, & token = cUSD are given ', async () => {
        const mockTransactionData: TransactionDataInput = {
          recipient: mockQRCodeRecipient,
          amount: new BigNumber('.5'),
          reason: mockUriData[5].comment,
          type: TokenTransactionType.PayPrefill,
        }

        await expectSaga(handleSendPaymentData, mockUriData[5])
          .provide([[matchers.call.fn(fetchExchangeRate), '2']])
          .run()
        expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
          transactionData: mockTransactionData,
          isFromScan: true,
          currencyInfo: { localCurrencyCode: mockUriData[5].currencyCode, localExchangeRate: '2' },
        })
      })
    })

    describe('deeplinks for withdrawing CELO', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })

      it('should navigate to WithdrawCeloReview screen when address, token = CELO, currencyCode, and amount are given ', async () => {
        await expectSaga(handleSendPaymentData, mockUriData[0])
          .provide([[matchers.call.fn(fetchExchangeRate), mockUriData[0].currencyCode]])
          .run()
        expect(navigate).toHaveBeenCalledWith(Screens.WithdrawCeloReviewScreen, {
          // @ts-ignore
          amount: new BigNumber(mockUriData[0].amount.valueOf()),
          recipientAddress: mockUriData[0].address.toLowerCase(),
          feeEstimate: new BigNumber(0),
        })
      })

      it('should not navigate to WithdrawCeloReview screen when only address & token = CELO are given ', async () => {
        await expectSaga(handleSendPaymentData, mockUriData[1])
          .provide([[matchers.call.fn(fetchExchangeRate), mockUriData[1].currencyCode]])
          .run()
        expect(navigate).not.toHaveBeenCalled()
      })

      it('should not navigate to any screen when an unsupported token is given ', async () => {
        await expectSaga(handleSendPaymentData, mockUriData[2])
          .provide([[matchers.call.fn(fetchExchangeRate), mockUriData[2].currencyCode]])
          .run()
        expect(navigate).not.toHaveBeenCalled()
      })
    })
  })
})
