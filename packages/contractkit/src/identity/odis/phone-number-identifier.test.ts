import {
  getPepperFromThresholdSignature,
  getPhoneNumberIdentifier,
  isBalanceSufficientForSigRetrieval,
} from './phone-number-identifier'
import { AuthenticationMethod, EncryptionKeySigner, ErrorMessages, ServiceContext } from './query'

jest.mock('./bls-blinding-client', () => {
  class WasmBlsBlindingClient {
    blindMessage = (m: string) => m
    unblindAndVerifyMessage = (m: string) => m
  }
  return {
    WasmBlsBlindingClient,
  }
})

const mockE164Number = '+14155550000'
const mockAccount = '0x0000000000000000000000000000000000007E57'

const serviceContext: ServiceContext = {
  odisUrl: 'https://mockodis.com',
  odisPubKey:
    '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA',
}
const endpoint = serviceContext.odisUrl + '/getBlindedMessageSig'

const authSigner: EncryptionKeySigner = {
  authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
  rawKey: '41e8e8593108eeedcbded883b8af34d2f028710355c57f4c10a056b72486aa04',
}

describe(isBalanceSufficientForSigRetrieval, () => {
  it('identifies sufficient balance correctly', () => {
    expect(isBalanceSufficientForSigRetrieval(0.009, 0.004)).toBe(false)
    expect(isBalanceSufficientForSigRetrieval(0.01, 0)).toBe(true)
    expect(isBalanceSufficientForSigRetrieval(0, 0.005)).toBe(true)
  })
})

describe(getPhoneNumberIdentifier, () => {
  afterEach(() => {
    fetchMock.reset()
  })

  it('Retrieves a pepper correctly', async () => {
    fetchMock.mock(endpoint, {
      success: true,
      combinedSignature: '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A',
    })

    await expect(
      getPhoneNumberIdentifier(mockE164Number, mockAccount, authSigner, serviceContext)
    ).resolves.toMatchObject({
      e164Number: mockE164Number,
      pepper: 'nHIvMC9B4j2+H',
      phoneHash: '0xf3ddadd1f488cdd42b9fa10354fdcae67c303ce182e71b30855733b50dce8301',
    })
  })

  it('Throws quota error', async () => {
    fetchMock.mock(endpoint, 403)

    await expect(
      getPhoneNumberIdentifier(mockE164Number, mockAccount, authSigner, serviceContext)
    ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  })

  it('Throws auth error', async () => {
    fetchMock.mock(endpoint, 401)
    await expect(
      getPhoneNumberIdentifier(mockE164Number, mockAccount, authSigner, serviceContext)
    ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
  })
})

describe(getPepperFromThresholdSignature, () => {
  it('Hashes sigs correctly', () => {
    const base64Sig = 'vJeFZJ3MY5KlpI9+kIIozKkZSR4cMymLPh2GHZUatWIiiLILyOcTiw2uqK/LBReA'
    const signature = new Buffer(base64Sig, 'base64')
    expect(getPepperFromThresholdSignature(signature)).toBe('piWqRHHYWtfg9')
  })
})
