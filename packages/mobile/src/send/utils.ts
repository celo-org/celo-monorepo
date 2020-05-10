import { FeeType } from 'src/fees/actions'
import { E164NumberToAddressType, RecipientVerificationStatus } from 'src/identity/reducer'
import { Recipient, RecipientKind } from 'src/recipients/recipient'
import { ManuallyValidatedE164NumberToAddress } from 'src/send/reducers'
import { TransactionData } from 'src/send/SendAmount'
import { ConfirmationInput } from 'src/send/SendConfirmation'
import Logger from 'src/utils/Logger'

export const formatDisplayName = (displayName: string) => {
  if (displayName !== 'Mobile #') {
    return { displayName, startOfSentenceDisplayName: displayName }
  }

  return { displayName: 'your contact', startOfSentenceDisplayName: 'Your contract' }
}

export const getAddressFromPhoneNumber = (
  e164Number: string,
  e164NumberToAddress: E164NumberToAddressType,
  manuallyValidatedE164NumberToAddress: ManuallyValidatedE164NumberToAddress
): string | null | undefined => {
  const addresses = e164NumberToAddress[e164Number]

  if (!addresses) {
    return addresses
  }

  if (addresses.length === 0) {
    throw new Error('Phone addresses array should never be empty')
  }

  if (addresses.length > 1) {
    Logger.warn('Number mapped to multiple addresses, need to disambiguate')
    const validatedAddress = manuallyValidatedE164NumberToAddress[e164Number]
    if (!validatedAddress) {
      throw new Error(
        'Multiple addresses but none were manually validated. Should have routed through secure send.'
      )
    }

    return validatedAddress
  }
  // Normal verified case, return the first address
  return addresses[0]
}

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

export const getVerificationStatus = (
  recipient: Recipient,
  e164NumberToAddress: E164NumberToAddressType
): RecipientVerificationStatus => {
  let recipientVerificationStatus
  if (recipient.kind === RecipientKind.QrCode || recipient.kind === RecipientKind.Address) {
    recipientVerificationStatus = RecipientVerificationStatus.VERIFIED
  } else {
    if (!recipient.e164PhoneNumber) {
      throw new Error('Phone number missing')
    }

    const addresses = e164NumberToAddress[recipient.e164PhoneNumber]
    if (addresses === undefined) {
      recipientVerificationStatus = RecipientVerificationStatus.UNKNOWN
    } else if (addresses === null) {
      recipientVerificationStatus = RecipientVerificationStatus.UNVERIFIED
    } else {
      recipientVerificationStatus = RecipientVerificationStatus.VERIFIED
    }
  }

  return recipientVerificationStatus
}

export const getFeeType = (
  recipientVerificationStatus: RecipientVerificationStatus
): FeeType | null => {
  switch (recipientVerificationStatus) {
    case RecipientVerificationStatus.UNKNOWN:
      return null
    case RecipientVerificationStatus.UNVERIFIED:
      return FeeType.INVITE
    case RecipientVerificationStatus.VERIFIED:
      return FeeType.SEND
  }
}

// Given addresses can be added and deleted we can't rely on changes in length to signal address changes
// Not sure if address order im array is consistent so not assuming it
const checkIfItemsOfChildArrAreSubsetOfParentArr = (parentArr: string[], childArr: string[]) => {
  const parentArrSorted = parentArr.sort()
  const childArrSorted = childArr.sort()

  for (let i = 0; i < childArrSorted.length; i += 1) {
    if (parentArrSorted[i] !== childArrSorted[i]) {
      return false
    }
  }

  return true
}

const checkIfNewAddressesAdded = (
  oldAddresses: string[] | null | undefined,
  newAddresses: string[]
) => {
  if (oldAddresses && checkIfItemsOfChildArrAreSubsetOfParentArr(oldAddresses, newAddresses)) {
    return false
  }

  return true
}

const checkIfLast4DigitsAreUnique = (addressArr: string[]) => {
  const last4DigitArr = addressArr.map((address) => address.slice(-4))
  const last4DigitSet = new Set()
  last4DigitArr.forEach((endDigits) => last4DigitSet.add(endDigits))
  return last4DigitArr.length === last4DigitSet.size
}

export const checkIfValidationRequired = (
  oldAddresses: string[] | undefined | null,
  newAddresses: string[] | null,
  userAddress: string,
  TAG: string
) => {
  let validationRequired = false
  let fullValidationRequired = false

  // if there are no addresses or only one, there is no validation needed
  if (!newAddresses || newAddresses.length < 2) {
    return { validationRequired, fullValidationRequired }
  }

  if (checkIfNewAddressesAdded(oldAddresses, newAddresses)) {
    Logger.debug(
      TAG + '@fetchPhoneAddressesAndAddressValidationStatus',
      `Address needs to be validated by user`
    )
    validationRequired = true
    // Adding user's address so they don't mistakenly verify with last 4 digits of their own address
    fullValidationRequired = !checkIfLast4DigitsAreUnique([userAddress, ...newAddresses])
  }

  return { validationRequired, fullValidationRequired }
}
