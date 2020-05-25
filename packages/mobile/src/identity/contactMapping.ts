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
  FetchAddressesAndValidateAction,
  requireSecureSend,
  updateE164PhoneNumberAddresses,
} from 'src/identity/actions'
import { fetchPhoneHashPrivate, PhoneNumberHashDetails } from 'src/identity/privacy'
import {
  AddressToE164NumberType,
  AddressValidationType,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
  SecureSendPhoneNumberMapping,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/reducer'
import { checkIfValidationRequired } from 'src/identity/secureSend'
import { setRecipientCache } from 'src/recipients/actions'
import { contactsToRecipients, NumberToRecipient } from 'src/recipients/recipient'
import { getAllContacts } from 'src/utils/contacts'
import Logger from 'src/utils/Logger'
import { checkContactsPermission } from 'src/utils/permissions'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

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
  // so that users can see a recipients list asap
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

export function* fetchAddressesAndValidateSaga({ e164Number }: FetchAddressesAndValidateAction) {
  try {
    Logger.debug(TAG + '@fetchAddressesAndValidate', `Fetching addresses for number`)
    const oldE164NumberToAddress = yield select(e164NumberToAddressSelector)
    const oldAddresses: string[] = oldE164NumberToAddress[e164Number] || []

    // Clear existing entries for those numbers so our mapping consumers know new status is pending.
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
      Logger.debug(TAG + '@fetchAddressesAndValidate', `No addresses for number`)
      // Save invalid/0 addresses to avoid checking again
      // null means a contact is unverified, whereas undefined means we haven't checked yet
      e164NumberToAddressUpdates[e164Number] = null
    } else {
      e164NumberToAddressUpdates[e164Number] = addresses
      addresses.map((a) => (addressToE164NumberUpdates[a] = e164Number))
    }

    const userAddress = yield select(currentAccountSelector)
    const secureSendPhoneNumberMapping = yield select(secureSendPhoneNumberMappingSelector)
    const addressValidationType = checkIfValidationRequired(
      oldAddresses,
      addresses,
      userAddress,
      secureSendPhoneNumberMapping,
      e164Number
    )

    if (addressValidationType !== AddressValidationType.NONE) {
      yield put(requireSecureSend(e164Number, addressValidationType))
    }

    yield put(
      updateE164PhoneNumberAddresses(e164NumberToAddressUpdates, addressToE164NumberUpdates)
    )
  } catch (error) {
    Logger.error(TAG + '@fetchAddressesAndValidateSaga', `Error fetching addresses`, error)
    if (error.message in ErrorMessages) {
      yield put(showError(error.message))
    } else {
      yield put(showError(ErrorMessages.ADDRESS_LOOKUP_FAILURE))
    }
  }
}

function* getAddresses(e164Number: string, attestationsWrapper: AttestationsWrapper) {
  let phoneHash: string
  if (USE_PHONE_NUMBER_PRIVACY) {
    const phoneHashDetails: PhoneNumberHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
    phoneHash = phoneHashDetails.phoneHash
  } else {
    phoneHash = getPhoneHash(e164Number)
  }

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

// Only use with multiple addresses if user has
// gone through SecureSend
export function getAddressFromPhoneNumber(
  e164Number: string,
  e164NumberToAddress: E164NumberToAddressType,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
): string | null | undefined {
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
}
