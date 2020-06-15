import { IdentifierLookupResult } from '@celo/contractkit/lib/wrappers/Attestations'
import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { setUserContactDetails } from 'src/account/actions'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { requireSecureSend, updateE164PhoneNumberAddresses } from 'src/identity/actions'
import { doImportContactsWrapper, fetchAddressesAndValidateSaga } from 'src/identity/contactMapping'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import {
  AddressValidationType,
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/reducer'
import { setRecipientCache } from 'src/recipients/actions'
import { contactsToRecipients } from 'src/recipients/recipient'
import { getAllContacts } from 'src/utils/contacts'
import { getContractKitOutsideGenerator } from 'src/web3/contracts'
import { getConnectedAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import {
  mockAccount,
  mockAccount2,
  mockAccountInvite,
  mockContactList,
  mockContactWithPhone2,
  mockE164Number,
  mockE164NumberHash,
} from 'test/values'

const recipients = contactsToRecipients(mockContactList, '+1')
const e164NumberRecipients = recipients!.e164NumberToRecipients
const otherRecipients = recipients!.otherRecipients
const allRecipients = { ...e164NumberRecipients, ...otherRecipients }

describe('Import Contacts Saga', () => {
  it('imports contacts and creates contact mappings correctly', async () => {
    await expectSaga(doImportContactsWrapper, { doMatchmaking: false })
      .provide([
        [call(getConnectedAccount), null],
        [call(getAllContacts), mockContactList],
        [select(defaultCountryCodeSelector), '+1'],
        [select(e164NumberSelector), mockE164Number],
      ])
      .put(
        setUserContactDetails(
          mockContactWithPhone2.recordID,
          mockContactWithPhone2.thumbnailPath || null
        )
      )
      .put(setRecipientCache(allRecipients))
      .run()
  })

  it('shows errors correctly', async () => {
    await expectSaga(doImportContactsWrapper, { doMatchmaking: false })
      .provide([
        [call(getConnectedAccount), null],
        [call(getAllContacts), throwError(new Error('fake error'))],
        [select(defaultCountryCodeSelector), '+1'],
        [select(e164NumberSelector), mockE164Number],
      ])
      .put(showError(ErrorMessages.IMPORT_CONTACTS_FAILED))
      .run()
  })
})

describe('Fetch Addresses Saga', () => {
  it('fetches and caches addresses correctly', async () => {
    const contractKit = await getContractKitOutsideGenerator()

    const mockE164NumberToAddress = {
      [mockE164Number]: [mockAccount.toLowerCase()],
    }

    const mockPhoneNumberLookup: IdentifierLookupResult = {
      [mockE164NumberHash]: { [mockAccount]: { completed: 3, total: 3 } },
    }

    const mockAttestationsWrapper = {
      lookupIdentifiers: jest.fn(() => mockPhoneNumberLookup),
    }

    await expectSaga(fetchAddressesAndValidateSaga, {
      e164Number: mockE164Number,
    })
      .provide([
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [call(fetchPhoneHashPrivate, mockE164Number), { phoneHash: mockE164NumberHash }],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [select(currentAccountSelector), mockAccount],
        [select(secureSendPhoneNumberMappingSelector), {}],
      ])
      .put(updateE164PhoneNumberAddresses({ [mockE164Number]: undefined }, {}))
      .put(
        updateE164PhoneNumberAddresses(
          {
            [mockE164Number]: [mockAccount.toLowerCase()],
          },
          {
            [mockAccount.toLowerCase()]: mockE164Number,
          }
        )
      )
      .run()
  })

  it('requires SecureSend with partial verification when a new adddress is added and last 4 digits are unique', async () => {
    const contractKit = await getContractKitOutsideGenerator()

    const mockPhoneNumberLookup: IdentifierLookupResult = {
      [mockE164NumberHash]: {
        [mockAccount]: { completed: 3, total: 3 },
        [mockAccount2]: { completed: 3, total: 3 },
      },
    }

    const mockAttestationsWrapper = {
      lookupIdentifiers: jest.fn(() => mockPhoneNumberLookup),
    }

    await expectSaga(fetchAddressesAndValidateSaga, {
      e164Number: mockE164Number,
    })
      .provide([
        [select(e164NumberToAddressSelector), {}],
        [call(fetchPhoneHashPrivate, mockE164Number), { phoneHash: mockE164NumberHash }],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [select(currentAccountSelector), mockAccountInvite],
        [select(secureSendPhoneNumberMappingSelector), {}],
      ])
      .put(updateE164PhoneNumberAddresses({ [mockE164Number]: undefined }, {}))
      .put(requireSecureSend(mockE164Number, AddressValidationType.PARTIAL))
      .put(
        updateE164PhoneNumberAddresses(
          {
            [mockE164Number]: [mockAccount.toLowerCase(), mockAccount2.toLowerCase()],
          },
          {
            [mockAccount.toLowerCase()]: mockE164Number,
            [mockAccount2.toLowerCase()]: mockE164Number,
          }
        )
      )
      .run()
  })

  it('requires SecureSend with full verification when a new adddress is added and last 4 digits are not unique', async () => {
    const contractKit = await getContractKitOutsideGenerator()

    const mockPhoneNumberLookup: IdentifierLookupResult = {
      [mockE164NumberHash]: {
        [mockAccount]: { completed: 3, total: 3 },
        [mockAccountInvite]: { completed: 3, total: 3 },
      },
    }

    const mockAttestationsWrapper = {
      lookupIdentifiers: jest.fn(() => mockPhoneNumberLookup),
    }

    await expectSaga(fetchAddressesAndValidateSaga, {
      e164Number: mockE164Number,
    })
      .provide([
        [select(e164NumberToAddressSelector), {}],
        [call(fetchPhoneHashPrivate, mockE164Number), { phoneHash: mockE164NumberHash }],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [select(currentAccountSelector), mockAccountInvite],
        [select(secureSendPhoneNumberMappingSelector), {}],
      ])
      .put(updateE164PhoneNumberAddresses({ [mockE164Number]: undefined }, {}))
      .put(requireSecureSend(mockE164Number, AddressValidationType.FULL))
      .put(
        updateE164PhoneNumberAddresses(
          {
            [mockE164Number]: [mockAccount.toLowerCase(), mockAccountInvite.toLowerCase()],
          },
          {
            [mockAccount.toLowerCase()]: mockE164Number,
            [mockAccountInvite.toLowerCase()]: mockE164Number,
          }
        )
      )
      .run()
  })
})
