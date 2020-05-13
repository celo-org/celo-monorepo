import { PaymentRequest } from 'src/account/types'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { AddressValidationCheckCache } from 'src/paymentRequest/IncomingPaymentRequestListScreen'
import { NumberToRecipient, Recipient, RecipientKind } from 'src/recipients/recipient'
import { SecureSendPhoneNumberMapping } from 'src/send/reducers'
import { checkIfAddressValidationRequired } from 'src/send/utils'

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
  } else {
    return {
      kind: RecipientKind.MobileNumber,
      address: paymentRequest.requesterAddress,
      displayName: paymentRequest.requesterE164Number || paymentRequest.requesterAddress,
      e164PhoneNumber: paymentRequest.requesterE164Number,
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
      address: paymentRequest.requesterAddress,
      e164PhoneNumber,
      displayName: e164PhoneNumber,
    }
  }
}

export const getAddressValidationCheckCache = (
  paymentRequests: PaymentRequest[],
  recipientCache: NumberToRecipient,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
): AddressValidationCheckCache => {
  const addressValidationCheckCache: AddressValidationCheckCache = {}

  paymentRequests.forEach((payment) => {
    const recipient = getRecipientFromPaymentRequest(payment, recipientCache)
    const { addressValidationRequired, fullValidationRequired } = checkIfAddressValidationRequired(
      recipient,
      secureSendPhoneNumberMapping
    )

    const { e164PhoneNumber } = recipient
    if (!e164PhoneNumber) {
      throw new Error('Missing recipient e164Number for payment request')
    }

    addressValidationCheckCache[e164PhoneNumber] = {
      addressValidationRequired,
      fullValidationRequired,
    }
  })

  return addressValidationCheckCache
}
