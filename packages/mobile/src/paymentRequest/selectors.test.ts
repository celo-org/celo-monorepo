import {
  getIncomingPaymentRequests,
  getOutgoingPaymentRequests,
} from 'src/paymentRequest/selectors'
import { PaymentRequestStatus } from 'src/paymentRequest/types'
import { createMockPaymentRequest } from 'src/paymentRequest/__mocks__'

describe('selectors', () => {
  describe(getIncomingPaymentRequests, () => {
    it('excludes declined and completed requests', () => {
      const state: any = {
        account: {
          incomingPaymentRequests: [
            createMockPaymentRequest({ status: PaymentRequestStatus.DECLINED }),
            createMockPaymentRequest({ status: PaymentRequestStatus.COMPLETED }),
          ],
        },
      }
      expect(getIncomingPaymentRequests(state)).toEqual([])
    })

    it('returns requested payments', () => {
      const goodRequest = createMockPaymentRequest({ status: PaymentRequestStatus.REQUESTED })

      const state: any = {
        account: {
          incomingPaymentRequests: [
            createMockPaymentRequest({
              status: PaymentRequestStatus.COMPLETED,
            }),
            goodRequest,
          ],
        },
      }

      expect(getIncomingPaymentRequests(state)).toEqual([goodRequest])
    })
  })

  describe(getOutgoingPaymentRequests, () => {
    it('excludes declined and completed requests', () => {
      const state: any = {
        account: {
          outgoingPaymentRequests: [
            createMockPaymentRequest({ status: PaymentRequestStatus.DECLINED }),
            createMockPaymentRequest({ status: PaymentRequestStatus.COMPLETED }),
          ],
        },
      }
      expect(getOutgoingPaymentRequests(state)).toEqual([])
    })

    it('returns requested payments', () => {
      const goodRequest = createMockPaymentRequest({ status: PaymentRequestStatus.REQUESTED })

      const state: any = {
        account: {
          outgoingPaymentRequests: [
            createMockPaymentRequest({
              status: PaymentRequestStatus.COMPLETED,
            }),
            goodRequest,
          ],
        },
      }

      expect(getOutgoingPaymentRequests(state)).toEqual([goodRequest])
    })
  })
})
