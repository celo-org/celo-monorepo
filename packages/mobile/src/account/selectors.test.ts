import { getPaymentRequests } from 'src/account/selectors'
import { PaymentRequestStatus } from 'src/account/types'
import { paymentRequestDouble } from 'src/paymentRequest/__mocks__'

describe('selectors', () => {
  describe(getPaymentRequests, () => {
    it('excludes declined and completed requests', () => {
      const state: any = {
        account: {
          paymentRequests: [
            paymentRequestDouble({ status: PaymentRequestStatus.DECLINED }),
            paymentRequestDouble({ status: PaymentRequestStatus.COMPLETED }),
          ],
        },
      }
      expect(getPaymentRequests(state)).toEqual([])
    })

    it('returns requested payments', () => {
      const goodRequest = paymentRequestDouble({ status: PaymentRequestStatus.REQUESTED })

      const state: any = {
        account: {
          paymentRequests: [
            paymentRequestDouble({
              status: PaymentRequestStatus.COMPLETED,
            }),
            goodRequest,
          ],
        },
      }

      expect(getPaymentRequests(state)).toEqual([goodRequest])
    })
  })
})
