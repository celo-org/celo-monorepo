import { FetchMock } from 'jest-fetch-mock'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getPhoneHashPrivate, getSaltFromThresholdSignature } from 'src/identity/privacy'
import { mockE164Number } from 'test/values'

jest.mock('react-native-blind-threshold-bls', () => ({
  blindMessage: jest.fn(() => 'abc123'),
  unblindMessage: jest.fn(() => 'YWJjMTIz'), // base64 of 'abc123'
}))

describe(getPhoneHashPrivate, () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    mockFetch.resetMocks()
  })

  it('retrieves salts correctly', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ salt: 'foobar' }))
    const result = await getPhoneHashPrivate(mockE164Number)
    expect(result).toBe('0x73585dd92c08c7fa648132310efd8f30a370e657b223fae92d7cc51f71b2dea8')
  })

  it('handles failure from quota', async () => {
    try {
      mockFetch.mockResponseOnce(JSON.stringify({ success: false }), { status: 401 })
      await getPhoneHashPrivate(mockE164Number)
      fail('expected error')
    } catch (error) {
      expect(error.message).toBe(ErrorMessages.SALT_QUOTA_EXCEEDED)
    }
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
