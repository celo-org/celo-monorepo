import { hexToBuffer } from '@celo/utils/lib/address'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { PaymentRequest } from 'src/paymentRequest/types'
import {
  decryptPaymentRequest,
  encryptPaymentRequest,
  getRequesteeFromPaymentRequest,
  getRequesterFromPaymentRequest,
} from 'src/paymentRequest/utils'
import { RecipientKind } from 'src/recipients/recipient'
import { doFetchDataEncryptionKey } from 'src/web3/dataEncryptionKey'
import {
  mockAccount,
  mockAccount2,
  mockE164Number,
  mockName,
  mockPaymentRequests,
  mockPrivateDEK,
  mockPublicDEK,
  mockPublicDEK2,
  mockRecipient,
} from 'test/values'

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(() => Buffer.from(new Uint8Array(16).fill(1))),
}))

const req = mockPaymentRequests[0]

describe('getRequesterFromPaymentRequest', () => {
  const address = req.requesterAddress
  const addressToE164Number = { [address]: mockE164Number }
  const recipientCache = { [mockE164Number]: mockRecipient }

  it('gets requester when only address is known', () => {
    const recipient = getRequesterFromPaymentRequest(req, {}, {})
    expect(recipient).toMatchObject({
      kind: RecipientKind.MobileNumber,
      address,
      displayName: mockE164Number,
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

const encryptedPaymentReq: PaymentRequest = {
  ...req,
  comment:
    'BNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBBhjruDecYg9fsrPNcQbI3AkcvWra1MHIeOZlcycn7Vqtx+UVNR59A3kqdIDbLuGiBNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBCVYJWqi/TZNXbAR9ziyX5MJCtfdulxA1tjlvHR/xpE6WnlC/kyXAfKIMqgKGJXchAQEBAQEBAQEBAQEBAQEBARp3jJ/hhfo07KIzSedfKMnSa2tt4odkbNB5oTBMlVzqyKA8zwTyZiTMr7IkE8y0hoBwRaK8GrXEzen9ycr4NIJ0yuJV8WNU7uU3NWnr3FhiQ60CtYiserbpwphRlzGvbL0hurQRjw==',
  requesterE164Number:
    'BNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBBhjruDecYg9fsrPNcQbI3AkcvWra1MHIeOZlcycn7Vqtx+UVNR59A3kqdIDbLuGiBNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBCVYJWqi/TZNXbAR9ziyX5MJCtfdulxA1tjlvHR/xpE6WnlC/kyXAfKIMqgKGJXchAQEBAQEBAQEBAQEBAQEBAXV31J+7haU0vKJ0SfJfe8mNaylt8oc5bKobMysx91ue1mBc8aLBawM5KfuZyKDBgckvD43PvjQ5',
}

describe('Encrypt Payment Request', () => {
  it('Encrypts valid payment request', async () => {
    await expectSaga(encryptPaymentRequest, req)
      .provide([
        [call(doFetchDataEncryptionKey, mockAccount), hexToBuffer(mockPublicDEK)],
        [call(doFetchDataEncryptionKey, mockAccount2), hexToBuffer(mockPublicDEK2)],
      ])
      .returns(encryptedPaymentReq)
      .run()
  })

  it('Does not encrypt when a DEK is missing', async () => {
    const sanitizedReq = {
      ...req,
      requesterE164Number: undefined,
    }
    await expectSaga(encryptPaymentRequest, req)
      .provide([
        [call(doFetchDataEncryptionKey, mockAccount), hexToBuffer(mockPublicDEK)],
        [call(doFetchDataEncryptionKey, mockAccount2), null],
      ])
      .returns(sanitizedReq)
      .run()
  })
})

describe('Decrypt Payment Request', () => {
  it('Derypts valid payment request', () => {
    expect(decryptPaymentRequest(encryptedPaymentReq, mockPrivateDEK, false)).toMatchObject(req)
  })

  it('Handles unencrypted payment request correctly', () => {
    expect(decryptPaymentRequest(req, mockPrivateDEK, false)).toMatchObject(req)
  })
})
