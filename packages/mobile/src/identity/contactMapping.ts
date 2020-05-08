import {
  AttestationsWrapper,
  IdentifierLookupResult,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { isValidAddress } from '@celo/utils/src/address'
import { getPhoneHash } from '@celo/utils/src/phoneNumbers'
import BigNumber from 'bignumber.js'
import { MinimalContact } from 'react-native-contacts'
import { call, put, select } from 'redux-saga/effects'
import { setUserContactDetails } from 'src/account/actions'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { USE_PHONE_NUMBER_PRIVACY } from 'src/config'
import {
  endImportContacts,
  FetchPhoneAddressesAction,
  GetAddressFromPhoneNumberAction,
  GetRecipientVerificationStatusAction,
  RecipientVerificationStatus,
  storeRecipientVerificationStatus,
  updateE164PhoneNumberAddresses,
} from 'src/identity/actions'
import { fetchPhoneHashPrivate, PhoneNumberHashDetails } from 'src/identity/privacy'
import {
  AddressToE164NumberType,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
} from 'src/identity/reducer'
import { setRecipientCache } from 'src/recipients/actions'
import { contactsToRecipients, NumberToRecipient, RecipientKind } from 'src/recipients/recipient'
import { manualAddressValidationRequired } from 'src/send/actions'
import { manuallyValidatedE164NumberToAddressSelector } from 'src/send/reducers'
import { getAllContacts } from 'src/utils/contacts'
import Logger from 'src/utils/Logger'
import { checkContactsPermission } from 'src/utils/permissions'
import { getContractKit } from 'src/web3/contracts'
import { userAddressSelector } from 'src/web3/reducer'
import { getConnectedAccount } from 'src/web3/saga'

const TAG = 'identity/contactMapping'

export function* doImportContactsWrapper() {
  yield call(getConnectedAccount)
  try {
    Logger.debug(TAG, 'Importing user contacts')

    yield call(doImportContacts)

    Logger.debug(TAG, 'Done importing user contacts')
    yield put(endImportContacts(true))
  } catch (error) {
    Logger.error(TAG, 'Error importing user contacts', error)
    yield put(showError(ErrorMessages.IMPORT_CONTACTS_FAILED))
    yield put(endImportContacts(false))
  }
}

function* doImportContacts() {
  const result: boolean = yield call(checkContactsPermission)

  if (!result) {
    return Logger.warn(TAG, 'Contact permissions denied. Skipping import.')
  }

  const contacts: MinimalContact[] = yield call(getAllContacts)
  if (!contacts || !contacts.length) {
    return Logger.warn(TAG, 'Empty contacts list. Skipping import.')
  }

  const defaultCountryCode: string = yield select(defaultCountryCodeSelector)
  const recipients = contactsToRecipients(contacts, defaultCountryCode)
  if (!recipients) {
    return Logger.warn(TAG, 'No recipients found')
  }
  const { e164NumberToRecipients, otherRecipients } = recipients

  yield call(updateUserContact, e164NumberToRecipients)

  // We call this here before we've refreshed the contact mapping
  //   so that users can see a recipients list asap
  yield call(updateRecipientsCache, e164NumberToRecipients, otherRecipients)
}

// Find the user's contact among those important and save useful bits
function* updateUserContact(e164NumberToRecipients: NumberToRecipient) {
  Logger.debug(TAG, 'Finding user contact details')
  const e164Number: string = yield select(e164NumberSelector)

  if (!e164Number) {
    return Logger.warn(TAG, 'User phone number not set, cannot find contact info')
  }

  const userRecipient = e164NumberToRecipients[e164Number]
  if (!userRecipient) {
    return Logger.debug(TAG, 'User contact not found among recipients')
  }

  yield put(setUserContactDetails(userRecipient.contactId, userRecipient.thumbnailPath || null))
}

function* updateRecipientsCache(
  e164NumberToRecipients: NumberToRecipient,
  otherRecipients: NumberToRecipient
) {
  Logger.debug(TAG, 'Updating recipients cache')
  yield put(setRecipientCache({ ...e164NumberToRecipients, ...otherRecipients }))
}

// Given addresses can be added and deleted we can't rely on changes in length to signal address changes
// Not sure if order is guaranteed to be consistent so not assuming it
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

const checkIfValidationNeeded = (
  oldAddresses: string[] | null | undefined,
  newAddresses: string[]
) => {
  // if there are no addresses or only one, no verification needed
  if (newAddresses.length < 2) {
    return false
  }

  // if there are previously stored addresses and no new addresses have been added, no verification needed
  if (oldAddresses && checkIfItemsOfChildArrAreSubsetOfParentArr(oldAddresses, newAddresses)) {
    return false
  }

  // if there are unaccounted for changes, require validation
  return true
}

const checkIfLast4DigitsAreUnique = (addressArr: string[]) => {
  const last4DigitArr = addressArr.map((address) => address.slice(-4))
  const last4DigitSet = new Set()
  last4DigitArr.forEach((endDigits) => last4DigitSet.add(endDigits))
  return last4DigitArr.length === last4DigitSet.size
}

export function* fetchPhoneAddresses({ e164Number }: FetchPhoneAddressesAction) {
  try {
    Logger.debug(TAG + '@fetchPhoneAddresses', `Fetching addresses for number`)
    // const oldE164NumberToAddress = yield select(e164NumberToAddressSelector)
    // const oldAddresses = oldE164NumberToAddress[e164Number]
    //   ? [...oldE164NumberToAddress[e164Number]]
    //   : oldE164NumberToAddress[e164Number]
    const oldAddresses = ['0xf1b1d5a6e7728a309c4a025b122d71ad75a61976']

    // Clear existing entries for those numbers so our mapping consumers
    // know new status is pending.
    Logger.debug(TAG + '@fetchPhoneAddresses', `Wiping current address mappings`)
    yield put(updateE164PhoneNumberAddresses({ [e164Number]: undefined }, {}))

    const contractKit = yield call(getContractKit)
    const attestationsWrapper: AttestationsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAttestations,
    ])

    Logger.debug(TAG + '@fetchPhoneAddresses', `Getting new addresses for ${e164Number}`)
    // const addresses: string[] | null = yield call(getAddresses, e164Number, attestationsWrapper)
    const addresses = [
      '0xf1b1d5a6e7728a309c4a025b122d71ad75a61976',
      '0x4ee307e8bdcaa2695b49cd6af380ac70914c7c78',
    ]

    if (!addresses.length) {
      throw Error('Array of addresses from Attestations contract was empty')
    }

    const e164NumberToAddressUpdates: E164NumberToAddressType = {}
    const addressToE164NumberUpdates: AddressToE164NumberType = {}

    if (!addresses) {
      Logger.debug(TAG + '@fetchPhoneAddresses', `No addresses for number`)
      // Save invalid/0 addresses to avoid checking again
      // null means a contact is unverified, whereas undefined means we haven't checked yet
      e164NumberToAddressUpdates[e164Number] = null
    } else {
      e164NumberToAddressUpdates[e164Number] = addresses
      addresses.map((a) => (addressToE164NumberUpdates[a] = e164Number))
    }

    if (addresses && checkIfValidationNeeded(oldAddresses, addresses)) {
      Logger.debug(TAG + '@fetchPhoneAddresses', `Address needs to be validated by user`)
      const userAddress = yield select(userAddressSelector)
      // Adding user's own address into the mix to make sure they don't mistakenly verify
      // with the last 4 digits of their own address
      const fullValidationRequired: boolean = !checkIfLast4DigitsAreUnique([
        userAddress,
        ...addresses,
      ])
      yield put(manualAddressValidationRequired(fullValidationRequired))
    }

    const recipientVerificationStatus = addresses
      ? RecipientVerificationStatus.VERIFIED
      : RecipientVerificationStatus.UNVERIFIED

    yield put(storeRecipientVerificationStatus(recipientVerificationStatus))

    yield put(
      updateE164PhoneNumberAddresses(e164NumberToAddressUpdates, addressToE164NumberUpdates)
    )
  } catch (error) {
    Logger.error(TAG + '@fetchPhoneAddresses', `Error fetching addresses`, error)
    yield put(showError(ErrorMessages.ADDRESS_LOOKUP_FAILURE))
  }
}

function* getAddresses(e164Number: string, attestationsWrapper: AttestationsWrapper) {
<<<<<<< HEAD
  let phoneHash: string
  if (USE_PHONE_NUMBER_PRIVACY) {
    const phoneHashDetails: PhoneNumberHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
    phoneHash = phoneHashDetails.phoneHash
  } else {
    phoneHash = getPhoneHash(e164Number)
  }
=======
  Logger.debug(TAG + '@getAddresses', `Looking up phoneHash for ${e164Number}`)
  const phoneHashDetails: PhoneNumberHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
  const phoneHash = phoneHashDetails.phoneHash
  Logger.debug(TAG + '@getAddresses', `Received phone hash: ${phoneHash}`)
>>>>>>> did more frontend work. still getting the backend error when attempting to fetch numbers for the address

  // Map of identifier -> (Map of address -> AttestationStat)
  const results: IdentifierLookupResult = yield call(
    [attestationsWrapper, attestationsWrapper.lookupIdentifiers],
    [phoneHash]
  )

  if (!results || !results[phoneHash]) {
    return null
  }

  const addresses = Object.keys(results[phoneHash]!)
    .filter(isValidNon0Address)
    .map((a) => a.toLowerCase())
  return addresses.length ? addresses : null
}

const isValidNon0Address = (address: string) =>
  typeof address === 'string' && isValidAddress(address) && !new BigNumber(address).isZero()

export function* getAddressFromPhoneNumber({ e164Number }: GetAddressFromPhoneNumberAction) {
  const e164NumberToAddress = yield select(e164NumberToAddressSelector)
  const addresses = e164NumberToAddress[e164Number]

  if (!addresses) {
    return addresses
  }

  if (addresses.length === 0) {
    throw new Error('Phone addresses array should never be empty')
  }

  if (addresses.length > 1) {
    Logger.warn(TAG, 'Number mapped to multiple addresses, need to disambiguate')
    const manuallyValidatedE164NumberToAddress = yield select(
      manuallyValidatedE164NumberToAddressSelector
    )

    const validatedAddress = manuallyValidatedE164NumberToAddress[e164Number]
    if (!validatedAddress) {
      throw new Error(
        'Multiple addresses but none were manually validated. Must go through secure send.'
      )
    }

    return validatedAddress
  }
  // Normal verified case, return the first address
  return addresses[0]
}

export function* getRecipientVerificationStatusSaga({
  recipient,
}: GetRecipientVerificationStatusAction) {
  let recipientVerificationStatus
  try {
    if (recipient.kind === RecipientKind.QrCode || recipient.kind === RecipientKind.Address) {
      // QR codes or Addresses are inherently verified
      recipientVerificationStatus = RecipientVerificationStatus.VERIFIED
    } else {
      const { e164PhoneNumber } = recipient

      if (!e164PhoneNumber) {
        throw Error(
          'Error retrieving phone number from recipient object. This should never happen.'
        )
      }

      const e164NumberToAddress = yield select(e164NumberToAddressSelector)
      const addresses = e164NumberToAddress[e164PhoneNumber]

      if (addresses === undefined) {
        // Undefined means the mapping has no entry for that number or the entry has been cleared
        recipientVerificationStatus = RecipientVerificationStatus.UNKNOWN
      } else if (addresses === null) {
        // Null means we have checked and found that number to be unverified
        recipientVerificationStatus = RecipientVerificationStatus.UNVERIFIED
      } else {
        // Otherwise, verified
        recipientVerificationStatus = RecipientVerificationStatus.VERIFIED
      }
    }

    yield put(storeRecipientVerificationStatus(recipientVerificationStatus))
  } catch (error) {
    Logger.error(`${TAG}/getRecipientVerificationStatusSaga`, 'Error with recipient data', error)
    // TODO: this should never happen but make an error message anyways
    yield put(showError(error.message))
  }
}

// export function getRecipientVerificationStatus(
//   recipient: Recipient,
//   e164NumberToAddress: E164NumberToAddressType
// ): RecipientVerificationStatus {
//   if (recipient.kind === RecipientKind.QrCode || recipient.kind === RecipientKind.Address) {
//     return RecipientVerificationStatus.VERIFIED
//   }

//   if (!recipient.e164PhoneNumber) {
//     throw new Error('No recipient e164Number found')
//   }

//   return getVerificationStatusFromPhoneNumber(recipient.e164PhoneNumber, e164NumberToAddress)
// }

// export function getAddressFromRecipient(
//   recipient: Recipient,
//   e164NumberToAddress: E164NumberToAddressType
// ): string | null | undefined {
//   if (recipient.kind === RecipientKind.QrCode || recipient.kind === RecipientKind.Address) {
//     return recipient.address
//   }

//   if (!recipient.e164PhoneNumber) {
//     throw new Error('Missing recipient e164Number')
//   }

//   return getAddressFromPhoneNumber(recipient.e164PhoneNumber, e164NumberToAddress)
// }
