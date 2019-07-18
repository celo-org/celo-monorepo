import { getPaymentRequests } from 'src/account/selectors'
import { PaymentRequestStatuses } from 'src/account/types'
import { paymentRequestDouble } from 'src/paymentRequest/__mocks__'

describe('selectors', () => {
  describe(getPaymentRequests, () => {
    it('excludes declined and completed requests', () => {
      const state: any = {
        account: {
          paymentRequests: [
            paymentRequestDouble({ status: PaymentRequestStatuses.DECLINED }),
            paymentRequestDouble({ status: PaymentRequestStatuses.COMPLETED }),
          ],
        },
      }
      expect(getPaymentRequests(state)).toEqual([])
    })

    it('returns requested payments', () => {
      const goodRequest = paymentRequestDouble({ status: PaymentRequestStatuses.REQUESTED })

      const state: any = {
        account: {
          paymentRequests: [
            paymentRequestDouble({
              status: PaymentRequestStatuses.COMPLETED,
            }),
            goodRequest,
          ],
        },
      }

      expect(getPaymentRequests(state)).toEqual([goodRequest])
    })
  })
})
