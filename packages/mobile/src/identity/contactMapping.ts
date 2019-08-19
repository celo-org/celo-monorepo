import { getPhoneHash } from '@celo/utils/src/phoneNumbers'
import { getAttestationsContract, lookupPhoneNumbers } from '@celo/walletkit'
import { Attestations as AttestationsType } from '@celo/walletkit/types/Attestations'
import BigNumber from 'bignumber.js'
import { chunk } from 'lodash'
import { MinimalContact } from 'react-native-contacts'
import { all, call, put, select } from 'redux-saga/effects'
import { setUserContactDetails } from 'src/account'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/reducer'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  endImportContacts,
  FetchPhoneAddressesAction,
  updateE164PhoneNumberAddresses,
} from 'src/identity/actions'
import {
  AddressToE164NumberType,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
} from 'src/identity/reducer'
import { setRecipientCache } from 'src/recipients/actions'
import { contactsToRecipients, NumberToRecipient } from 'src/recipients/recipient'
import { checkContactsPermission } from 'src/utils/androidPermissions'
import { getAllContacts } from 'src/utils/contacts'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { getConnectedAccount } from 'src/web3/saga'

const TAG = 'identity/contactMapping'
const MAPPING_CHUNK_SIZE = 25
const NUM_PARALLEL_REQUESTS = 3

export function* doImportContacts() {
  Logger.debug(TAG, 'Importing user contacts')
  try {
    yield call(getConnectedAccount)

    const result: boolean = yield call(checkContactsPermission)

    if (!result) {
      return Logger.warn(TAG, 'Contact permissions denied. Skipping import.')
    }

    const contacts: MinimalContact[] = yield call(getAllContacts)
    if (!contacts || !contacts.length) {
      return Logger.warn(TAG, 'Empty contacts list. Skipping import.')
    }

    const defaultCountryCode: string = yield select(defaultCountryCodeSelector)
    const e164NumberToAddress: E164NumberToAddressType = yield select(e164NumberToAddressSelector)
    const recipients = contactsToRecipients(contacts, defaultCountryCode, e164NumberToAddress)
    if (!recipients) {
      return Logger.warn(TAG, 'No recipients found')
    }
    const { e164NumberToRecipients, otherRecipients } = recipients

    yield call(updateUserContact, e164NumberToRecipients)

    // We call this here before we've refreshed the contact mapping
    //   so that users can see a recipients list asap
    yield call(updateRecipientsCache, e164NumberToRecipients, otherRecipients)

    yield call(lookupNewRecipients, e164NumberToAddress, e164NumberToRecipients, otherRecipients)

    Logger.debug(TAG, 'Done importing user contacts')
    yield put(endImportContacts(true))
  } catch (error) {
    Logger.error(TAG, 'Error importing user contacts', error)
    yield put(showError(ErrorMessages.IMPORT_CONTACTS_FAILED))
    yield put(endImportContacts(false))
  }
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

// Lookup addresses for any recipient numbers we haven't checked before
//   and update the recipients cache once lookup is done
function* lookupNewRecipients(
  e164NumberToAddress: E164NumberToAddressType,
  e164NumberToRecipients: NumberToRecipient,
  otherRecipients: NumberToRecipient
) {
  Logger.debug(TAG, 'Looking up new recipients')
  // Iterate through all numbers found in recipients and lookup any
  // numbers we haven't checked before
  const newE164Numbers: string[] = []
  for (const e164Number of Object.keys(e164NumberToRecipients)) {
    if (e164Number && e164NumberToAddress[e164Number] === undefined) {
      newE164Numbers.push(e164Number)
    }
  }

  if (!newE164Numbers.length) {
    return Logger.debug(`${TAG}@refreshContactMapping`, 'No new numbers to check')
  }
  Logger.debug(TAG, `Total new recipients found: ${newE164Numbers.length}`)

  const attestationsContract: AttestationsType = yield call(getAttestationsContract, web3)

  // If chunk sizes are too large, or number of parallel lookups too high
  // we see errors from web3. So we break things down and limit parallelization
  // This is still not perfect, errors due still occur randomly for some chunks
  const numberChunks = chunk(newE164Numbers, MAPPING_CHUNK_SIZE)
  const requestChunks = chunk(numberChunks, NUM_PARALLEL_REQUESTS)
  Logger.debug(
    TAG,
    `Lookup up: ${numberChunks.length} number chunks across ${requestChunks.length} request rounds`
  )
  for (const requestChunk of requestChunks) {
    yield all(
      requestChunk.map((numberChunk) =>
        call(fetchAndStoreAddressMappings, attestationsContract, numberChunk)
      )
    )
  }

  // Now that mappings are updated, update the recipient objects
  // TODO(Rossy) Consider revisiting the use of addresses in recip objects (to avoid confusion with the maps)
  const updatedE164NumberToAddress: E164NumberToAddressType = yield select(
    e164NumberToAddressSelector
  )
  for (const newNumber of newE164Numbers) {
    e164NumberToRecipients[newNumber].address = updatedE164NumberToAddress[newNumber] || undefined
  }

  yield call(updateRecipientsCache, e164NumberToRecipients, otherRecipients)
}

async function getAddresses(e164Numbers: string[], attestationsContract: AttestationsType) {
  Logger.debug(TAG, `Get addresses for ${e164Numbers.length} phone numbers`)
  const phoneHashes = e164Numbers.map((phoneNumber) => getPhoneHash(phoneNumber))
  const results = await lookupPhoneNumbers(attestationsContract, phoneHashes)
  if (!results) {
    return null
  }

  const addresses: Array<string | null> = []
  for (const hash of phoneHashes) {
    if (results[hash]) {
      // TODO(Rossy) Add support for handling multiple addresses per number
      const address = Object.keys(results[hash]!)[0]
      addresses.push(address.toLowerCase())
    } else {
      addresses.push(null)
    }
  }
  return addresses
}

const isValidAddress = (address: string) =>
  typeof address === 'string' && !new BigNumber(address).isZero()

export function* fetchAndStoreAddressMappings(
  attestationsContract: AttestationsType,
  e164Numbers: string[]
) {
  try {
    Logger.debug(TAG, `Fetch and store address mapping for ${e164Numbers.length} phone numbers`)

    const addresses: Array<string | null> = yield getAddresses(e164Numbers, attestationsContract)

    if (!addresses || addresses.length !== e164Numbers.length) {
      throw new Error('Address lookup length did not match numbers list length')
    }

    Logger.debug(TAG, `Retrieved ${addresses.length} addresses`)

    const e164NumberToAddressUpdates: E164NumberToAddressType = {}
    const addressToE164NumberUpdates: AddressToE164NumberType = {}

    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i]
      const e164Number = e164Numbers[i]

      if (address && isValidAddress(address)) {
        e164NumberToAddressUpdates[e164Number] = address
        addressToE164NumberUpdates[address] = e164Number
      } else {
        // Save invalid/0 addresses to avoid checking again
        // null means a contact is unverified, whereas undefined means we haven't checked yet
        e164NumberToAddressUpdates[e164Number] = null
      }
    }

    yield put(
      updateE164PhoneNumberAddresses(e164NumberToAddressUpdates, addressToE164NumberUpdates)
    )
  } catch (error) {
    Logger.error(TAG, `Error fetching addresses for chunk: ${e164Numbers}`, error)
  }
}

export function* fetchPhoneAddresses(action: FetchPhoneAddressesAction) {
  const e164Numbers = action.numbers
  Logger.debug(TAG + '@fetchPhoneAddresses', `Fetching addresses for ${e164Numbers.length} numbers`)
  // Clear existing entries for those numbers so our mapping consumers
  // know new status is pending.
  const e164NumberToAddressUpdates: any = {}
  e164Numbers.map((n) => (e164NumberToAddressUpdates[n] = undefined))
  yield put(updateE164PhoneNumberAddresses(e164NumberToAddressUpdates, {}))
  const attestationsContract: AttestationsType = yield call(getAttestationsContract, web3)
  yield call(fetchAndStoreAddressMappings, attestationsContract, e164Numbers)
}

export enum VerificationStatus {
  UNVERIFIED = 0,
  VERIFIED = 1,
  UNKNOWN = 2,
}

export function getAddressFromPhoneNumber(
  e164Number: string,
  e164NumberToAddress: E164NumberToAddressType
): string | null | undefined {
  if (!e164NumberToAddress || !e164Number) {
    throw new Error('Invalid params @getPhoneNumberAddress')
  }

  return e164NumberToAddress[e164Number]
}

export function getVerificationStatusFromPhoneNumber(
  e164Number: string,
  e164NumberToAddress: E164NumberToAddressType
): VerificationStatus {
  const address = getAddressFromPhoneNumber(e164Number, e164NumberToAddress)

  // Undefined means the mapping has no entry for that number
  // or the entry has been cleared
  if (address === undefined) {
    return VerificationStatus.UNKNOWN
  }
  // null means we have checked and found that number to be unverified
  if (address === null) {
    return VerificationStatus.UNVERIFIED
  }

  // Otherwise, verified
  return VerificationStatus.VERIFIED
}
