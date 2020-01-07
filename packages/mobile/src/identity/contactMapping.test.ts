import { getPhoneHash } from '@celo/utils/src/phoneNumbers'
import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { setUserContactDetails } from 'src/account/actions'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/reducer'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { updateE164PhoneNumberAddresses } from 'src/identity/actions'
import { doImportContactsWrapper } from 'src/identity/contactMapping'
import { e164NumberToAddressSelector } from 'src/identity/reducer'
import { setRecipientCache } from 'src/recipients/actions'
import { contactsToRecipients } from 'src/recipients/recipient'
import { getAllContacts } from 'src/utils/contacts'
import { contractKit } from 'src/web3/contracts'
import { getConnectedAccount } from 'src/web3/saga'
import {
  mockAccount,
  mockAccount2,
  mockContactList,
  mockContactWithPhone2,
  mockE164Number,
  mockE164Number2,
} from 'test/values'

// TODO implement a smarter way to have contract kit mocked well across the whole project
jest.mock('src/web3/contracts', () => ({
  contractKit: {
    contracts: {
      getAttestations: jest.fn(),
      getAccounts: jest.fn(),
    },
  },
}))

const mockPhoneNumberLookup = {
  [getPhoneHash(mockE164Number)]: { [mockAccount]: { complete: 3, total: 3 } },
  [getPhoneHash(mockE164Number2)]: { [mockAccount2]: { complete: 3, total: 4 } },
}

const mockAttestationsWrapper = {
  lookupPhoneNumbers: jest.fn(() => mockPhoneNumberLookup),
}

const recipients = contactsToRecipients(mockContactList, '+1', {})
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
        [select(e164NumberToAddressSelector), {}],
        [select(e164NumberSelector), mockE164Number],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
      ])
      .put(
        setUserContactDetails(
          mockContactWithPhone2.recordID,
          mockContactWithPhone2.thumbnailPath || null
        )
      )
      .put(setRecipientCache(allRecipients))
      .put(
        updateE164PhoneNumberAddresses(
          {
            [mockE164Number]: mockAccount.toLowerCase(),
            [mockE164Number2]: mockAccount2.toLowerCase(),
          },
          {
            [mockAccount.toLowerCase()]: mockE164Number,
            [mockAccount2.toLowerCase()]: mockE164Number2,
          }
        )
      )
      .put(setRecipientCache(allRecipients))
      .returns(undefined)
      .run()
  })

  it('shows errors correctly', async () => {
    await expectSaga(doImportContactsWrapper)
      .provide([
        [call(getConnectedAccount), null],
        [call(getAllContacts), mockContactList],
        [select(defaultCountryCodeSelector), '+1'],
        [select(e164NumberToAddressSelector), {}],
        [select(e164NumberSelector), mockE164Number],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          throwError(new Error('fake error')),
        ],
      ])
      .put(
        setUserContactDetails(
          mockContactWithPhone2.recordID,
          mockContactWithPhone2.thumbnailPath || null
        )
      )
      .put(setRecipientCache(allRecipients))
      .put(showError(ErrorMessages.IMPORT_CONTACTS_FAILED))
      .returns(undefined)
      .run()
  })
})
