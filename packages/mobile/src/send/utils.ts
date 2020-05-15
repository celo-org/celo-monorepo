import { ErrorMessages } from 'src/app/ErrorMessages'
import { FeeType } from 'src/fees/actions'
import { E164NumberToAddressType, RecipientVerificationStatus } from 'src/identity/reducer'
import { Recipient, RecipientKind } from 'src/recipients/recipient'
import { SecureSendPhoneNumberMapping } from 'src/send/reducers'
import { TransactionDataInput } from 'src/send/SendAmount'
import { ConfirmationInput } from 'src/send/SendConfirmation'
import Logger from 'src/utils/Logger'

export const getAddressFromPhoneNumber = (
  e164Number: string,
  e164NumberToAddress: E164NumberToAddressType,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
): string | null | undefined => {
  const TAG = 'send/utils'
  try {
    const addresses = e164NumberToAddress[e164Number]

    // If address is null (unverified) or undefined (in the process
    // of being updated) then just return that falsy value
    if (!addresses) {
      return addresses
    }

    // If there are multiple addresses, need to determine which to use
    if (addresses.length > 1) {
      // Check if the user has gone through Secure Send and validated a
      // recipient address
      const validatedAddress = secureSendPhoneNumberMapping[e164Number]
        ? secureSendPhoneNumberMapping[e164Number].address
        : undefined

      // If they have not, they shouldn't have been able to
      // get to this point
      if (!validatedAddress) {
        throw new Error(
          'Multiple addresses but none were validated. Should have routed through Secure Send.'
        )
      }

      return validatedAddress
    }

    // Normal case when there is only one address in the mapping
    return addresses[0]
  } catch (error) {
    Logger.error(TAG, error.message)
  }
}

export const getConfirmationInput = (
  transactionData: TransactionDataInput,
  e164NumberToAddress: E164NumberToAddressType,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
): ConfirmationInput => {
  const { recipient } = transactionData
  let recipientAddress: string | null | undefined

  if (recipient.kind === RecipientKind.QrCode || recipient.kind === RecipientKind.Address) {
    recipientAddress = recipient.address
  } else if (recipient.e164PhoneNumber) {
    recipientAddress = getAddressFromPhoneNumber(
      recipient.e164PhoneNumber,
      e164NumberToAddress,
      secureSendPhoneNumberMapping
    )
  }

  return { ...transactionData, recipientAddress }
}

export const getVerificationStatus = (
  recipient: Recipient,
  e164NumberToAddress: E164NumberToAddressType
): RecipientVerificationStatus => {
  if (recipient.kind === RecipientKind.QrCode || recipient.kind === RecipientKind.Address) {
    return RecipientVerificationStatus.VERIFIED
  }

  if (recipient.e164PhoneNumber) {
    const addresses = e164NumberToAddress[recipient.e164PhoneNumber]

    if (addresses === undefined) {
      return RecipientVerificationStatus.UNKNOWN
    }

    if (addresses === null) {
      return RecipientVerificationStatus.UNVERIFIED
    }

    return RecipientVerificationStatus.VERIFIED
  }

  return RecipientVerificationStatus.UNKNOWN
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
// Not sure if address order in array is consistent so not assuming it
const newAddressesAdded = (oldAddresses: string[], newAddresses: string[]) => {
  const oldAddressesSorted = oldAddresses.sort()
  const newAddressesSorted = newAddresses.sort()

  for (let i = 0; i < newAddressesSorted.length; i += 1) {
    if (oldAddressesSorted[i] !== newAddressesSorted[i]) {
      return true
    }
  }

  return false
}

const last4DigitsAreUnique = (addressArr: string[]) => {
  const last4DigitArr = addressArr.map((address) => address.slice(-4).toLowerCase())
  const last4DigitSet = new Set()
  last4DigitArr.forEach((endDigits) => last4DigitSet.add(endDigits))
  return last4DigitArr.length === last4DigitSet.size
}

// Check if there are multiple addresses but somehow a preferred addresses hasn't been set yet
// Should never happen in production but makes the change backwards compatible for testing env
const accidentallyBypassedValidation = (
  newAddresses: string[] | null,
  e164Number: string,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
) => {
  const validatedAddress =
    secureSendPhoneNumberMapping[e164Number] || secureSendPhoneNumberMapping[e164Number].address
  return newAddresses && newAddresses.length > 1 && !validatedAddress
}

export const checkIfValidationRequired = (
  oldAddresses: string[],
  newAddresses: string[] | null,
  userAddress: string,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping,
  e164Number: string,
  TAG: string
) => {
  let validationRequired = false
  let fullValidationRequired = false

  // if there are no addresses or only one, there is no validation needed
  if (!newAddresses || newAddresses.length < 2) {
    return { validationRequired, fullValidationRequired }
  }

  if (
    newAddressesAdded(oldAddresses, newAddresses) ||
    accidentallyBypassedValidation(newAddresses, e164Number, secureSendPhoneNumberMapping)
  ) {
    Logger.debug(
      TAG + '@fetchPhoneAddressesAndAddressValidationStatus',
      `Address needs to be validated by user`
    )
    validationRequired = true
    // Adding user's address so they don't mistakenly verify with last 4 digits of their own address
    fullValidationRequired = !last4DigitsAreUnique([userAddress, ...newAddresses])
  }

  return { validationRequired, fullValidationRequired }
}

const hasSpecialChars = (address: string, fullValidation: boolean) => {
  const regex = new RegExp('[^0-9A-Za-z]', 'g')
  const cleanedAddress = address.replace(regex, '')

  if (cleanedAddress !== address) {
    const errorMessage = fullValidation
      ? ErrorMessages.ADDRESS_VALIDATION_FULL_POORLY_FORMATTED
      : ErrorMessages.ADDRESS_VALIDATION_PARTIAL_POORLY_FORMATTED
    throw Error(errorMessage)
  }
}

const validateFullAddressAndReturnMatch = (
  userInputtedAddress: string,
  possibleRecievingAddresses: string[],
  userAddress: string
) => {
  if (userInputtedAddress.length !== 42 || userInputtedAddress.slice(0, 2) !== '0x') {
    throw Error(ErrorMessages.ADDRESS_VALIDATION_FULL_POORLY_FORMATTED)
  }

  if (userInputtedAddress === userAddress) {
    throw Error(ErrorMessages.ADDRESS_VALIDATION_FULL_OWN_ADDRESS)
  }

  if (!possibleRecievingAddresses.includes(userInputtedAddress)) {
    throw Error(ErrorMessages.ADDRESS_VALIDATION_NO_MATCH)
  }

  return userInputtedAddress
}

const validatePartialAddressAndReturnMatch = (
  lastFourDigitsOfUserInputtedAddress: string,
  possibleRecievingAddresses: string[],
  userAddress: string
) => {
  if (lastFourDigitsOfUserInputtedAddress.length !== 4) {
    throw Error(ErrorMessages.ADDRESS_VALIDATION_PARTIAL_POORLY_FORMATTED)
  }

  if (lastFourDigitsOfUserInputtedAddress === userAddress.slice(-4)) {
    throw Error(ErrorMessages.ADDRESS_VALIDATION_PARTIAL_OWN_ADDRESS)
  }

  const targetAddress = possibleRecievingAddresses.find(
    (address) => address.slice(-4) === lastFourDigitsOfUserInputtedAddress
  )

  if (!targetAddress) {
    throw Error(ErrorMessages.ADDRESS_VALIDATION_NO_MATCH)
  }

  return targetAddress
}

export const validateAndReturnMatch = (
  userInputOfFullAddressOrLastFourDigits: string,
  possibleRecievingAddresses: string[],
  userAddress: string,
  fullAddressValidationRequired: boolean
) => {
  const userInput = userInputOfFullAddressOrLastFourDigits.toLowerCase()
  const possibleAddresses = possibleRecievingAddresses.map((address) => address.toLowerCase())
  const userOwnAddress = userAddress.toLowerCase()

  hasSpecialChars(userInputOfFullAddressOrLastFourDigits, fullAddressValidationRequired)

  if (fullAddressValidationRequired) {
    return validateFullAddressAndReturnMatch(userInput, possibleAddresses, userOwnAddress)
  }
  return validatePartialAddressAndReturnMatch(userInput, possibleAddresses, userOwnAddress)
}

export const checkIfAddressValidationRequired = (
  recipient: Recipient,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
) => {
  if (recipient.e164PhoneNumber) {
    const { e164PhoneNumber } = recipient

    if (
      secureSendPhoneNumberMapping[e164PhoneNumber] &&
      secureSendPhoneNumberMapping[e164PhoneNumber].addressValidationRequired
    ) {
      const { addressValidationRequired, fullValidationRequired } = secureSendPhoneNumberMapping[
        e164PhoneNumber
      ]
      return { addressValidationRequired, fullValidationRequired }
    }
  }

  return { addressValidationRequired: false, fullValidationRequired: false }
}
