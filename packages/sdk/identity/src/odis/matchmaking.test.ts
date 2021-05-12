import { getContactMatches, obfuscateNumberForMatchmaking } from './matchmaking'
import { AuthenticationMethod, EncryptionKeySigner, ErrorMessages, ServiceContext } from './query'

const mockE164Number = '+14155550000'
const mockE164Number2 = '+14155550002'
const mockE164Number3 = '+14155550003'
const mockContacts = [mockE164Number2, mockE164Number3]
const mockAccount = '0x0000000000000000000000000000000000007E57'

const serviceContext: ServiceContext = {
  odisUrl: 'https://mockodis.com',
  odisPubKey:
    '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA',
}
const endpoint = serviceContext.odisUrl + '/getContactMatches'

const authSigner: EncryptionKeySigner = {
  authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
  rawKey: '41e8e8593108eeedcbded883b8af34d2f028710355c57f4c10a056b72486aa04',
}

describe(getContactMatches, () => {
  afterEach(() => {
    fetchMock.reset()
  })

  it('Retrieves matches correctly', async () => {
    fetchMock.mock(endpoint, {
      success: true,
      matchedContacts: [{ phoneNumber: obfuscateNumberForMatchmaking(mockE164Number2) }],
    })

    await expect(
      getContactMatches(
        mockE164Number,
        mockContacts,
        mockAccount,
        mockAccount,
        authSigner,
        serviceContext
      )
    ).resolves.toMatchObject([mockE164Number2])
  })

  it('Throws quota error', async () => {
    fetchMock.mock(endpoint, 403)

    await expect(
      getContactMatches(
        mockE164Number,
        mockContacts,
        mockAccount,
        mockAccount,
        authSigner,
        serviceContext
      )
    ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  })

  it('Throws auth error', async () => {
    fetchMock.mock(endpoint, 401)
    await expect(
      getContactMatches(
        mockE164Number,
        mockContacts,
        mockAccount,
        mockAccount,
        authSigner,
        serviceContext
      )
    ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
  })
})

describe(obfuscateNumberForMatchmaking, () => {
  it('Hashes a number correctly', () => {
    expect(obfuscateNumberForMatchmaking(mockE164Number)).toBe(
      '2sLQ49R4yTFxeknNQRQEj01WcCx3kLQam29TFbrXcxU='
    )
  })
})
