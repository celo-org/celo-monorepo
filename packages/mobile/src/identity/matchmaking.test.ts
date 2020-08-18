import { OdisUtils } from '@celo/contractkit'
import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import { FetchMock } from 'jest-fetch-mock'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import { addContactsMatches } from 'src/identity/actions'
import { fetchContactMatches } from 'src/identity/matchmaking'
import { getUserSelfPhoneHashDetails } from 'src/identity/privateHashing'
import { NumberToRecipient, RecipientKind } from 'src/recipients/recipient'
import { isAccountUpToDate } from 'src/web3/dataEncryptionKey'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockE164Number,
  mockE164Number2,
  mockE164NumberHash,
  mockE164NumberPepper,
} from 'test/values'

jest.mock('@celo/contractkit', () => ({
  ...jest.requireActual('@celo/contractkit'),
  ...jest.requireActual('../../__mocks__/@celo/contractkit/index'),
}))

describe('Fetch contact matches', () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    mockFetch.resetMocks()
  })

  it('retrieves matches correctly', async () => {
    mockFetch.mockResponseOnce(
      JSON.stringify({
        success: true,
        matchedContacts: [
          {
            phoneNumber: 'Fox23FU+SCdDPhk2I2h4e2UC63lyOWMygxc4wTAXu9w=',
          },
        ],
      })
    )

    const e164NumberToRecipients: NumberToRecipient = {
      [mockE164Number]: {
        kind: RecipientKind.Contact,
        contactId: 'contactId1',
        displayName: 'contact1',
        e164PhoneNumber: mockE164Number,
      },
      [mockE164Number2]: {
        kind: RecipientKind.Contact,
        contactId: 'contactId2',
        displayName: 'contact2',
        e164PhoneNumber: mockE164Number2,
      },
      '+491515555555': {
        kind: RecipientKind.Contact,
        contactId: 'contactId3',
        displayName: 'contact3',
        e164PhoneNumber: '+491515555555',
      },
    }

    const phoneHashDetails: PhoneNumberHashDetails = {
      e164Number: mockE164Number,
      phoneHash: mockE164NumberHash,
      pepper: mockE164NumberPepper,
    }

    const expectedMatches = {
      [mockE164Number2]: { contactId: 'contactId2' },
    }

    const state = createMockStore({
      web3: { account: mockAccount },
      account: { pincodeType: PincodeType.CustomPin },
    }).getState()

    await expectSaga(fetchContactMatches, e164NumberToRecipients)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(getUserSelfPhoneHashDetails), phoneHashDetails],
        [matchers.call.fn(isAccountUpToDate), true],
        [matchers.call.fn(OdisUtils.Matchmaking.getContactMatches), [mockE164Number2]],
      ])
      .withState(state)
      .put(addContactsMatches(expectedMatches))
      .run()
  })
})

describe(OdisUtils.Matchmaking.obfuscateNumberForMatchmaking, () => {
  it('Hashes sigs correctly', () => {
    expect(OdisUtils.Matchmaking.obfuscateNumberForMatchmaking(mockE164Number2)).toBe(
      'Fox23FU+SCdDPhk2I2h4e2UC63lyOWMygxc4wTAXu9w='
    )
  })
})
