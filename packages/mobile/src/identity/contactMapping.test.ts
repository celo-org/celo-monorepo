import { getAttestationsContract } from '@celo/walletkit'
import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { setUserContactDetails } from 'src/account'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/reducer'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { updateE164PhoneNumberAddresses } from 'src/identity/actions'
import { doImportContacts } from 'src/identity/contactMapping'
import { e164NumberToAddressSelector } from 'src/identity/reducer'
import { waitForUserVerified } from 'src/identity/verification'
import { setRecipientCache } from 'src/recipients/actions'
import { contactsToRecipients } from 'src/recipients/recipient'
import { getAllContacts } from 'src/utils/contacts'
import { web3 } from 'src/web3/contracts'
import { getConnectedAccount } from 'src/web3/saga'
import { createMockContract } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockContactList,
  mockContactWithPhone2,
  mockE164Number,
  mockE164Number2,
} from 'test/values'

const attestationsStub = {
  batchGetAttestationStats: [[1, 1], [mockAccount, mockAccount2], [3, 3], [3, 4]],
}
const recipients = contactsToRecipients(mockContactList, '+1', {})
const e164NumberRecipients = recipients!.e164NumberToRecipients
const otherRecipients = recipients!.otherRecipients
const allRecipients = { ...e164NumberRecipients, ...otherRecipients }

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('Import Contacts Saga', () => {
  it('imports contacts and creates contact mappings correctly', async () => {
    const attestationsContract = createMockContract(attestationsStub)
    await expectSaga(doImportContacts)
      .provide([
        [call(getConnectedAccount), null],
        [call(waitForUserVerified), true],
        [call(getAllContacts), mockContactList],
        [select(defaultCountryCodeSelector), '+1'],
        [select(e164NumberToAddressSelector), {}],
        [select(e164NumberSelector), mockE164Number],
        [call(getAttestationsContract, web3), attestationsContract],
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
    await expectSaga(doImportContacts)
      .provide([
        [call(getConnectedAccount), null],
        [call(waitForUserVerified), true],
        [call(getAllContacts), mockContactList],
        [select(defaultCountryCodeSelector), '+1'],
        [select(e164NumberToAddressSelector), {}],
        [select(e164NumberSelector), mockE164Number],
        [call(getAttestationsContract, web3), throwError(new Error('fake error'))],
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
