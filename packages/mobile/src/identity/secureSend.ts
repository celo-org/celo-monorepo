import { ErrorMessages } from 'src/app/ErrorMessages'
import { AddressValidationType, SecureSendPhoneNumberMapping } from 'src/identity/reducer'
import { Recipient } from 'src/recipients/recipient'
import Logger from 'src/utils/Logger'

const TAG = 'identity/secureSend'

// Given addresses can be added and deleted we can't rely on changes in length to signal address changes
// Not sure if address order in array is consistent so not assuming it
function newAddressesAdded(oldAddresses: string[], newAddresses: string[]) {
  const oldAddressesSorted = oldAddresses.sort()
  const newAddressesSorted = newAddresses.sort()

  for (let i = 0; i < newAddressesSorted.length; i += 1) {
    if (oldAddressesSorted[i] !== newAddressesSorted[i]) {
      return true
    }
  }

  return false
}

function last4DigitsAreUnique(addressArr: string[]) {
  const last4DigitArr = addressArr.map((address) => address.slice(-4).toLowerCase())
  const last4DigitSet = new Set()
  last4DigitArr.forEach((endDigits) => last4DigitSet.add(endDigits))
  return last4DigitArr.length === last4DigitSet.size
}

// Check if there are multiple addresses but somehow a preferred addresses hasn't been set yet
// Should never happen in production but makes the change backwards compatible for testing env
function accidentallyBypassedValidation(
  newAddresses: string[] | null,
  e164Number: string,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
) {
  const validatedAddress =
    secureSendPhoneNumberMapping[e164Number] || secureSendPhoneNumberMapping[e164Number].address
  return newAddresses && newAddresses.length > 1 && !validatedAddress
}

export function checkIfValidationRequired(
  oldAddresses: string[],
  possibleAddresses: string[],
  userAddress: string,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping,
  e164Number: string
) {
  // No validation needed if there is only 1 possible address
  if (possibleAddresses.length < 2) {
    return AddressValidationType.NONE
  }

  if (
    newAddressesAdded(oldAddresses, possibleAddresses) ||
    accidentallyBypassedValidation(possibleAddresses, e164Number, secureSendPhoneNumberMapping)
  ) {
    Logger.debug(TAG, 'Address needs to be validated by user')
    // Adding user's address so they don't mistakenly verify with last 4 digits of their own address
    if (last4DigitsAreUnique([userAddress, ...possibleAddresses])) {
      return AddressValidationType.PARTIAL
    }
    return AddressValidationType.FULL
  }

  return AddressValidationType.NONE
}

function hasSpecialChars(address: string, addressValidationType: AddressValidationType) {
  const regex = new RegExp('[^0-9A-Za-z]', 'g')
  const cleanedAddress = address.replace(regex, '')

  if (cleanedAddress !== address) {
    const errorMessage =
      addressValidationType === AddressValidationType.FULL
        ? ErrorMessages.ADDRESS_VALIDATION_FULL_POORLY_FORMATTED
        : ErrorMessages.ADDRESS_VALIDATION_PARTIAL_POORLY_FORMATTED
    throw Error(errorMessage)
  }
}

function validateFullAddressAndReturnMatch(
  userInputtedAddress: string,
  possibleRecievingAddresses: string[],
  userAddress: string
) {
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

function validatePartialAddressAndReturnMatch(
  lastFourDigitsOfUserInputtedAddress: string,
  possibleRecievingAddresses: string[],
  userAddress: string
) {
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

export function validateAndReturnMatch(
  userInputOfFullAddressOrLastFourDigits: string,
  possibleRecievingAddresses: string[],
  userAddress: string,
  addressValidationType: AddressValidationType
) {
  const userInput = userInputOfFullAddressOrLastFourDigits.toLowerCase()
  const possibleAddresses = possibleRecievingAddresses.map((address) => address.toLowerCase())
  const userOwnAddress = userAddress.toLowerCase()

  hasSpecialChars(userInputOfFullAddressOrLastFourDigits, addressValidationType)

  if (addressValidationType === AddressValidationType.FULL) {
    return validateFullAddressAndReturnMatch(userInput, possibleAddresses, userOwnAddress)
  }
  return validatePartialAddressAndReturnMatch(userInput, possibleAddresses, userOwnAddress)
}

export function getAddressValidationType(
  recipient: Recipient,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
) {
  const { e164PhoneNumber } = recipient

  if (
    !e164PhoneNumber ||
    !secureSendPhoneNumberMapping[e164PhoneNumber] ||
    !secureSendPhoneNumberMapping[e164PhoneNumber].addressValidationType
  ) {
    return AddressValidationType.NONE
  }

  return secureSendPhoneNumberMapping[e164PhoneNumber].addressValidationType
}

export function getSecureSendAddress(
  recipient: Recipient,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
) {
  const { e164PhoneNumber } = recipient
  if (!e164PhoneNumber || !secureSendPhoneNumberMapping[e164PhoneNumber]) {
    return undefined
  }

  return secureSendPhoneNumberMapping[e164PhoneNumber].address
}
