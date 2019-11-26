import { getIncomingPaymentRequests } from 'src/account/selectors'
import { PaymentRequestStatus } from 'src/account/types'
import { paymentRequestDouble } from 'src/paymentRequest/__mocks__'

describe('selectors', () => {
  describe(getIncomingPaymentRequests, () => {
    it('excludes declined and completed requests', () => {
      const state: any = {
        account: {
          incomingPaymentRequests: [
            paymentRequestDouble({ status: PaymentRequestStatus.DECLINED }),
            paymentRequestDouble({ status: PaymentRequestStatus.COMPLETED }),
          ],
        },
      }
      expect(getIncomingPaymentRequests(state)).toEqual([])
    })

    it('returns requested payments', () => {
      const goodRequest = paymentRequestDouble({ status: PaymentRequestStatus.REQUESTED })

      const state: any = {
        account: {
          incomingPaymentRequests: [
            paymentRequestDouble({
              status: PaymentRequestStatus.COMPLETED,
            }),
            goodRequest,
          ],
        },
      }

      expect(getIncomingPaymentRequests(state)).toEqual([goodRequest])
    })
  })
})
