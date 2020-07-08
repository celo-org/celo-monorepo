import {
  getRequesteeFromPaymentRequest,
  getRequesterFromPaymentRequest,
} from 'src/paymentRequest/utils'
import { RecipientKind } from 'src/recipients/recipient'
import { mockE164Number, mockName, mockPaymentRequests, mockRecipient } from 'test/values'

describe('Payment request utils', () => {
  const req = mockPaymentRequests[0]

  describe('getRequesterFromPaymentRequest', () => {
    const address = req.requesterAddress
    const addressToE164Number = { [address]: mockE164Number }
    const recipientCache = { [mockE164Number]: mockRecipient }

    it('gets requester when only address is known', () => {
      const recipient = getRequesterFromPaymentRequest(req, {}, {})
      expect(recipient).toMatchObject({
        kind: RecipientKind.Address,
        address,
        displayName: address,
      })
    })

    it('gets requester when address is cached but not recipient', () => {
      const recipient = getRequesterFromPaymentRequest(req, addressToE164Number, {})
      expect(recipient).toMatchObject({
        kind: RecipientKind.MobileNumber,
        address,
        e164PhoneNumber: mockE164Number,
        displayName: mockE164Number,
      })
    })

    it('gets requester when address and recip are cached', () => {
      const recipient = getRequesterFromPaymentRequest(req, addressToE164Number, recipientCache)
      expect(recipient).toMatchObject({
        kind: RecipientKind.Address,
        address,
        e164PhoneNumber: mockE164Number,
        displayName: mockName,
      })
    })
  })

  describe('getRequesteeFromPaymentRequest', () => {
    const address = req.requesteeAddress
    const addressToE164Number = { [address]: mockE164Number }
    const recipientCache = { [mockE164Number]: mockRecipient }

    it('gets requestee when only address is known', () => {
      const recipient = getRequesteeFromPaymentRequest(req, {}, {})
      expect(recipient).toMatchObject({
        kind: RecipientKind.Address,
        address,
        displayName: address,
      })
    })

    it('gets requestee when address is cached but not recipient', () => {
      const recipient = getRequesteeFromPaymentRequest(req, addressToE164Number, {})
      expect(recipient).toMatchObject({
        kind: RecipientKind.MobileNumber,
        address,
        e164PhoneNumber: mockE164Number,
        displayName: mockE164Number,
      })
    })

    it('gets requestee when address and recip are cached', () => {
      const recipient = getRequesteeFromPaymentRequest(req, addressToE164Number, recipientCache)
      expect(recipient).toMatchObject({
        kind: RecipientKind.Address,
        address,
        e164PhoneNumber: mockE164Number,
        displayName: mockName,
      })
    })
  })
})
