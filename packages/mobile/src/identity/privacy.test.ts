import { FetchMock } from 'jest-fetch-mock'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { updateE164PhoneNumberSalts } from 'src/identity/actions'
import { fetchPhoneHashPrivate, getSaltFromThresholdSignature } from 'src/identity/privacy'
import { e164NumberToSaltSelector } from 'src/identity/reducer'
import { currentAccountSelector } from 'src/web3/selectors'
import { mockAccount, mockE164Number } from 'test/values'

jest.mock('react-native-blind-threshold-bls', () => ({
  blindMessage: jest.fn(() => 'abc123'),
  unblindMessage: jest.fn(() => 'YWJjMTIz'), // base64 of 'abc123'
}))

describe('Fetch phone hash details', () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    mockFetch.resetMocks()
  })

  it('retrieves salts correctly', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ salt: 'foobar' }))
    const expectedSalt = '6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090'
    const expectedHash = '0x73585dd92c08c7fa648132310efd8f30a370e657b223fae92d7cc51f71b2dea8'

    await expectSaga(fetchPhoneHashPrivate, mockE164Number)
      .provide([
        [select(e164NumberToSaltSelector), {}],
        [select(currentAccountSelector), mockAccount],
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
    const base64Sig = 'YWJjMTIz' // base64 of 'abc123'
    expect(getSaltFromThresholdSignature(base64Sig)).toBe(
      '6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090'
    )
  })
})
