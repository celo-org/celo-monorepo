import {
  AttestationsWrapper,
  IdentifierLookupResult,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { isValidAddress } from '@celo/utils/src/address'
import BigNumber from 'bignumber.js'
import { MinimalContact } from 'react-native-contacts'
import { call, put, select } from 'redux-saga/effects'
import { setUserContactDetails } from 'src/account/actions'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  endImportContacts,
  FetchPhoneAddressesAction,
  updateE164PhoneNumberAddresses,
} from 'src/identity/actions'
import { fetchPhoneHashPrivate, PhoneNumberHashDetails } from 'src/identity/privacy'
import { AddressToE164NumberType, E164NumberToAddressType } from 'src/identity/reducer'
import { setRecipientCache } from 'src/recipients/actions'
import { contactsToRecipients, NumberToRecipient } from 'src/recipients/recipient'
import { getAllContacts } from 'src/utils/contacts'
import Logger from 'src/utils/Logger'
import { checkContactsPermission } from 'src/utils/permissions'
import { getContractKit } from 'src/web3/contracts'
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

export function* fetchPhoneAddresses({ e164Number }: FetchPhoneAddressesAction) {
  try {
    Logger.debug(TAG + '@fetchPhoneAddresses', `Fetching addresses for number`)
    // Clear existing entries for those numbers so our mapping consumers
    // know new status is pending.
    yield put(updateE164PhoneNumberAddresses({ [e164Number]: undefined }, {}))

    const contractKit = yield call(getContractKit)
    const attestationsWrapper: AttestationsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAttestations,
    ])

    const addresses: string[] | null = yield call(getAddresses, e164Number, attestationsWrapper)

    const e164NumberToAddressUpdates: E164NumberToAddressType = {}
    const addressToE164NumberUpdates: AddressToE164NumberType = {}

    if (!addresses) {
      Logger.debug(TAG + '@fetchPhoneAddresses', `No addresses for for number`)
      // Save invalid/0 addresses to avoid checking again
      // null means a contact is unverified, whereas undefined means we haven't checked yet
      e164NumberToAddressUpdates[e164Number] = null
    } else {
      e164NumberToAddressUpdates[e164Number] = addresses
      addresses.map((a) => (addressToE164NumberUpdates[a] = e164Number))
    }

    yield put(
      updateE164PhoneNumberAddresses(e164NumberToAddressUpdates, addressToE164NumberUpdates)
    )
  } catch (error) {
    Logger.error(TAG + '@fetchPhoneAddresses', `Error fetching addresses`, error)
    yield put(showError(ErrorMessages.ADDRESS_LOOKUP_FAILURE))
  }
}

function* getAddresses(e164Number: string, attestationsWrapper: AttestationsWrapper) {
  const phoneHashDetails: PhoneNumberHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
  const phoneHash = phoneHashDetails.phoneHash

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

export function getAddressFromPhoneNumber(
  e164Number: string,
  e164NumberToAddress: E164NumberToAddressType
): string | null | undefined {
  if (!e164NumberToAddress || !e164Number) {
    throw new Error('Invalid params @getPhoneNumberAddress')
  }

  const addresses = e164NumberToAddress[e164Number]

  if (!addresses) {
    return addresses
  }

  if (addresses.length === 0) {
    throw new Error('Phone addresses array should never be empty')
  }

  if (addresses.length > 1) {
    Logger.warn(TAG, 'Number mapped to multiple addresses, need to disambiguate')
    // TODO handle with Secure Send flow, return latest for now
    return addresses[addresses.length - 1]
  }

  // Normal verified case, return the first address
  return addresses[0]
}

export enum RecipientVerificationStatus {
  UNVERIFIED = 0,
  VERIFIED = 1,
  UNKNOWN = 2,
}

export function getVerificationStatusFromPhoneNumber(
  e164Number: string,
  e164NumberToAddress: E164NumberToAddressType
): RecipientVerificationStatus {
  const address = getAddressFromPhoneNumber(e164Number, e164NumberToAddress)

  // Undefined means the mapping has no entry for that number
  // or the entry has been cleared
  if (address === undefined) {
    return RecipientVerificationStatus.UNKNOWN
  }
  // null means we have checked and found that number to be unverified
  if (address === null) {
    return RecipientVerificationStatus.UNVERIFIED
  }

  // Otherwise, verified
  return RecipientVerificationStatus.VERIFIED
}
