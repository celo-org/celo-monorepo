import { PaymentRequest } from 'src/account'
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
      kind: RecipientKind.Address,
      address: paymentRequest.requesterAddress,
    }
  } else {
    return {
      kind: RecipientKind.Address,
      address: paymentRequest.requesterAddress,
      displayName: paymentRequest.requesterE164Number || paymentRequest.requesterAddress,
    }
  }
}
