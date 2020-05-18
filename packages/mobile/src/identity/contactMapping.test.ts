import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { setUserContactDetails } from 'src/account/actions'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { updateE164PhoneNumberAddresses } from 'src/identity/actions'
import { doImportContactsWrapper, fetchPhoneAddresses } from 'src/identity/contactMapping'
import { fetchPhoneHashPrivate } from 'src/identity/privacy'
import { setRecipientCache } from 'src/recipients/actions'
import { contactsToRecipients } from 'src/recipients/recipient'
import { getAllContacts } from 'src/utils/contacts'
import { getContractKitOutsideGenerator } from 'src/web3/contracts'
import { getConnectedAccount } from 'src/web3/saga'
import {
  mockAccount,
  mockContactList,
  mockContactWithPhone2,
  mockE164Number,
  mockE164NumberHash,
} from 'test/values'

const mockPhoneNumberLookup = {
  [mockE164NumberHash]: { [mockAccount]: { complete: 3, total: 3 } },
}

const mockAttestationsWrapper = {
  lookupIdentifiers: jest.fn(() => mockPhoneNumberLookup),
}

const recipients = contactsToRecipients(mockContactList, '+1')
const e164NumberRecipients = recipients!.e164NumberToRecipients
const otherRecipients = recipients!.otherRecipients
const allRecipients = { ...e164NumberRecipients, ...otherRecipients }

describe('Import Contacts Saga', () => {
  it('imports contacts and creates contact mappings correctly', async () => {
    await expectSaga(doImportContactsWrapper)
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
    await expectSaga(doImportContactsWrapper)
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
  // TODO reenable when PGPNP gets enabled
  it.skip('fetches and caches addresses correctly', async () => {
    const contractKit = await getContractKitOutsideGenerator()
    await expectSaga(fetchPhoneAddresses, { e164Number: mockE164Number })
      .provide([
        [call(fetchPhoneHashPrivate, mockE164Number), { phoneHash: mockE164NumberHash }],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
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
})
