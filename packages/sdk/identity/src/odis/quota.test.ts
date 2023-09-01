import { AuthenticationMethod, CombinerEndpoint } from '@celo/phone-number-privacy-common'
import fetchMock from '../__mocks__/cross-fetch'
import { EncryptionKeySigner, ServiceContext } from './query'
import { getPnpQuotaStatus, PnpClientQuotaStatus } from './quota'

const mockAccount = '0x0000000000000000000000000000000000007E57'
const serviceContext: ServiceContext = {
  odisUrl: 'https://mockodis.com',
  odisPubKey:
    '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA',
}
const endpoint = serviceContext.odisUrl + CombinerEndpoint.PNP_QUOTA
const rawKey = '41e8e8593108eeedcbded883b8af34d2f028710355c57f4c10a056b72486aa04'

const authSigner: EncryptionKeySigner = {
  authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
  rawKey,
}

describe(getPnpQuotaStatus, () => {
  afterEach(() => {
    fetchMock.reset()
  })
  it('returns the correct remaining quota amount', async () => {
    const performedQueryCount = 5
    const totalQuota = 10
    const version = ''
    fetchMock.mock(endpoint, {
      success: true,
      totalQuota,
      performedQueryCount,
      version,
    })

    await expect(
      getPnpQuotaStatus(mockAccount, authSigner, serviceContext)
    ).resolves.toStrictEqual<PnpClientQuotaStatus>({
      performedQueryCount,
      totalQuota,
      remainingQuota: totalQuota - performedQueryCount,
      version,
      warnings: undefined,
    })
  })

  it('throws quota error on failure response', async () => {
    fetchMock.mock(endpoint, {
      success: false,
      version: '',
    })

    await expect(getPnpQuotaStatus(mockAccount, authSigner, serviceContext)).rejects.toThrow()
  })
})
