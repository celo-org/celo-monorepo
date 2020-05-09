import { getAddressFromPhoneNumber } from 'src/identity/contactMapping'
import { E164NumberToAddressType } from 'src/identity/reducer'
import { RecipientKind } from 'src/recipients/recipient'
import { ManuallyValidatedE164NumberToAddress } from 'src/send/reducers'
import { TransactionData } from 'src/send/SendAmount'
import { ConfirmationInput } from 'src/send/SendConfirmation'

export const getConfirmationInput = (
  transactionData: TransactionData,
  e164NumberToAddress: E164NumberToAddressType,
  manuallyValidatedE164NumberToAddress: ManuallyValidatedE164NumberToAddress
): ConfirmationInput => {
  const { recipient } = transactionData
  let recipientAddress: string | null | undefined

  if (recipient.kind === RecipientKind.QrCode || recipient.kind === RecipientKind.Address) {
    recipientAddress = recipient.address
  } else {
    if (!recipient.e164PhoneNumber) {
      throw new Error('Phone number missing')
    }

    recipientAddress = getAddressFromPhoneNumber(
      recipient.e164PhoneNumber,
      e164NumberToAddress,
      manuallyValidatedE164NumberToAddress
    )

    if (!recipientAddress) {
      throw new Error("Can't find an address for the phone number")
    }
  }

  return { ...transactionData, recipientAddress }
}
