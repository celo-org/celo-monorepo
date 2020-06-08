import { FetchMock } from 'jest-fetch-mock'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { addContactsMatches } from 'src/identity/actions'
import { fetchContactMatches, obfuscateNumberForMatchmaking } from 'src/identity/matchmaking'
import { getUserSelfPhoneHashDetails, PhoneNumberHashDetails } from 'src/identity/privateHashing'
import { NumberToRecipient, RecipientKind } from 'src/recipients/recipient'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import {
  mockAccount,
  mockE164Number,
  mockE164Number2,
  mockE164NumberHash,
  mockE164NumberSalt,
} from 'test/values'

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
      salt: mockE164NumberSalt,
    }

    const expectedMatches = {
      [mockE164Number2]: { contactId: 'contactId2' },
    }

    await expectSaga(fetchContactMatches, e164NumberToRecipients)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(getUserSelfPhoneHashDetails), phoneHashDetails],
      ])
      .put(addContactsMatches(expectedMatches))
      .run()
  })
})

describe(obfuscateNumberForMatchmaking, () => {
  it('Hashes sigs correctly', () => {
    expect(obfuscateNumberForMatchmaking(mockE164Number2)).toBe(
      'Fox23FU+SCdDPhk2I2h4e2UC63lyOWMygxc4wTAXu9w='
    )
  })
})
