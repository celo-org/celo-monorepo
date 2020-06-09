import { FetchMock } from 'jest-fetch-mock'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { updateE164PhoneNumberSalts } from 'src/identity/actions'
import { fetchPhoneHashPrivate, getSaltFromThresholdSignature } from 'src/identity/privateHashing'
import { e164NumberToSaltSelector } from 'src/identity/reducer'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { mockAccount, mockE164Number, mockE164Number2 } from 'test/values'

jest.mock('react-native-blind-threshold-bls', () => ({
  blindMessage: jest.fn(() => '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A'),
  unblindMessage: jest.fn(() => 'vJeFZJ3MY5KlpI9+kIIozKkZSR4cMymLPh2GHZUatWIiiLILyOcTiw2uqK/LBReA'),
}))

describe('Fetch phone hash details', () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    mockFetch.resetMocks()
  })

  it('retrieves salts correctly', async () => {
    mockFetch.mockResponseOnce(
      JSON.stringify({
        success: true,
        signature: '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A',
      })
    )
    const expectedSalt = 'piWqRHHYWtfg9'
    const expectedHash = '0xf6429456331dedf8bd32b5e3a578e5bc589a28d012724dcd3e0a4b1be67bb454'

    await expectSaga(fetchPhoneHashPrivate, mockE164Number)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(e164NumberSelector), mockE164Number2],
        [select(e164NumberToSaltSelector), {}],
      ])
      .put(
        updateE164PhoneNumberSalts({
          [mockE164Number]: expectedSalt,
        })
      )
      .returns({
        e164Number: mockE164Number,
        salt: expectedSalt,
        phoneHash: expectedHash,
      })
      .run()
  })

  it.skip('handles failure from quota', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ success: false }), { status: 403 })
    // TODO confirm it navs to quota purchase screen
  })
})

describe(getSaltFromThresholdSignature, () => {
  it('Hashes sigs correctly', () => {
    const base64Sig = 'vJeFZJ3MY5KlpI9+kIIozKkZSR4cMymLPh2GHZUatWIiiLILyOcTiw2uqK/LBReA'
    expect(getSaltFromThresholdSignature(base64Sig)).toBe('piWqRHHYWtfg9')
  })
})
