import { AddressToE164NumberType, SecureSendPhoneNumberMapping } from 'src/identity/reducer'
import { getAddressValidationType } from 'src/identity/secureSend'
import { AddressValidationCheckCache } from 'src/paymentRequest/IncomingPaymentRequestListScreen'
import { PaymentRequest } from 'src/paymentRequest/types'
import { NumberToRecipient, Recipient, RecipientKind } from 'src/recipients/recipient'

// Returns a recipient for the SENDER of a payment request
// i.e. this account when outgoing, another when incoming
export function getRequesterFromPaymentRequest(
  paymentRequest: PaymentRequest,
  addressToE164Number: AddressToE164NumberType,
  recipientCache: NumberToRecipient
): Recipient {
  return getRecipientObjectFromPaymentRequest(
    paymentRequest,
    addressToE164Number,
    recipientCache,
    false
  )
}

// Returns a recipient for the TARGET of a payment request
// i.e. this account when incoming, another when outgoing
export function getRequesteeFromPaymentRequest(
  paymentRequest: PaymentRequest,
  addressToE164Number: AddressToE164NumberType,
  recipientCache: NumberToRecipient
): Recipient {
  return getRecipientObjectFromPaymentRequest(
    paymentRequest,
    addressToE164Number,
    recipientCache,
    true
  )
}

function getRecipientObjectFromPaymentRequest(
  paymentRequest: PaymentRequest,
  addressToE164Number: AddressToE164NumberType,
  recipientCache: NumberToRecipient,
  isRequestee: boolean
): Recipient {
  const address = isRequestee ? paymentRequest.requesteeAddress : paymentRequest.requesterAddress
  const e164PhoneNumber = addressToE164Number[address]
  if (!e164PhoneNumber) {
    return {
      kind: RecipientKind.Address,
      address,
      displayName: address,
    }
  }

  const cachedRecipient = recipientCache[e164PhoneNumber]
  if (cachedRecipient) {
    return {
      ...cachedRecipient,
      kind: RecipientKind.Address,
      address,
    }
  } else {
    return {
      kind: RecipientKind.MobileNumber,
      address,
      e164PhoneNumber,
      displayName: e164PhoneNumber,
    }
  }
}

export const getAddressValidationCheckCache = (
  paymentRequests: PaymentRequest[],
  addressToE164Number: AddressToE164NumberType,
  recipientCache: NumberToRecipient,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
): AddressValidationCheckCache => {
  const addressValidationCheckCache: AddressValidationCheckCache = {}

  paymentRequests.forEach((payment) => {
    const recipient = getRequesterFromPaymentRequest(payment, addressToE164Number, recipientCache)
    const addressValidationType = getAddressValidationType(recipient, secureSendPhoneNumberMapping)

    const { e164PhoneNumber } = recipient
    if (e164PhoneNumber) {
      addressValidationCheckCache[e164PhoneNumber] = addressValidationType
    }
  })

  return addressValidationCheckCache
}
