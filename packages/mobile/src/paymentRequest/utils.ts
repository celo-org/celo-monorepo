import { PaymentRequest } from 'src/account/types'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { NumberToRecipient, Recipient, RecipientKind } from 'src/recipients/recipient'

export function getRecipientFromPaymentRequest(
  paymentRequest: PaymentRequest,
  recipientCache: NumberToRecipient
): Recipient {
  const cachedRecipient = paymentRequest.requesterE164Number
    ? recipientCache[paymentRequest.requesterE164Number]
    : null

  if (cachedRecipient) {
    return {
      ...cachedRecipient,
      kind: RecipientKind.Contact,
      address: paymentRequest.requesterAddress,
    }
  } else if (paymentRequest.requesterE164Number) {
    return {
      kind: RecipientKind.MobileNumber,
      address: paymentRequest.requesterAddress,
      displayName: paymentRequest.requesterE164Number,
      e164PhoneNumber: paymentRequest.requesterE164Number,
    }
  } else {
    return {
      kind: RecipientKind.Address,
      address: paymentRequest.requesterAddress,
      displayName: paymentRequest.requesterAddress,
    }
  }
}

export function getSenderFromPaymentRequest(
  paymentRequest: PaymentRequest,
  addressToE164Number: AddressToE164NumberType,
  recipientCache: NumberToRecipient
): Recipient {
  const e164PhoneNumber = addressToE164Number[paymentRequest.requesteeAddress]
  if (!e164PhoneNumber) {
    return {
      kind: RecipientKind.Address,
      address: paymentRequest.requesteeAddress,
      displayName: paymentRequest.requesteeAddress,
    }
  }

  const cachedRecipient = recipientCache[e164PhoneNumber]
  if (cachedRecipient) {
    return {
      ...cachedRecipient,
      kind: RecipientKind.Address,
      address: paymentRequest.requesteeAddress,
    }
  } else {
    return {
      kind: RecipientKind.MobileNumber,
      address: paymentRequest.requesteeAddress,
      e164PhoneNumber,
      displayName: e164PhoneNumber,
    }
  }
}
