import { CombinerEndpoint } from '@celo/phone-number-privacy-common'
import { WasmBlsBlindingClient } from './bls-blinding-client'
import {
  getBlindedIdentifier,
  getBlindedIdentifierSignature,
  getObfuscatedIdentifier,
  getObfuscatedIdentifierFromSignature,
  getPepperFromThresholdSignature,
  IdentifierPrefix,
} from './identifier'
import { AuthenticationMethod, EncryptionKeySigner, ErrorMessages, ServiceContext } from './query'

jest.mock('./bls-blinding-client', () => {
  // tslint:disable-next-line:no-shadowed-variable
  class WasmBlsBlindingClient {
    blindMessage = (m: string) => m
    unblindAndVerifyMessage = (m: string) => m
  }
  return {
    WasmBlsBlindingClient,
  }
})

const mockOffchainIdentifier = 'twitterHandle'
const mockAccount = '0x0000000000000000000000000000000000007E57'
const expectedIdentifierHash = '0x36fda45dcdb40c403f8387e56ca7913f851dc66cde3f4e17843953dcc8947650'
const expectedPepper = 'nHIvMC9B4j2+H'

const serviceContext: ServiceContext = {
  odisUrl: 'https://mockodis.com',
  odisPubKey:
    '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA',
}
const endpoint = serviceContext.odisUrl + CombinerEndpoint.PNP_SIGN
const rawKey = '41e8e8593108eeedcbded883b8af34d2f028710355c57f4c10a056b72486aa04'

const authSigner: EncryptionKeySigner = {
  authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
  rawKey,
}

describe(getObfuscatedIdentifier, () => {
  afterEach(() => {
    fetchMock.reset()
  })

  describe('Retrieves a pepper correctly', () => {
    it('Using EncryptionKeySigner', async () => {
      fetchMock.mock(endpoint, {
        success: true,
        signature: '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A',
        performedQueryCount: 5,
        totalQuota: 10,
        version: '',
      })

      const blsBlindingClient = new WasmBlsBlindingClient(serviceContext.odisPubKey)
      const base64BlindedMessage = await getBlindedIdentifier(
        mockOffchainIdentifier,
        IdentifierPrefix.TWITTER,
        blsBlindingClient
      )
      const base64BlindSig = await getBlindedIdentifierSignature(
        mockAccount,
        authSigner,
        serviceContext,
        base64BlindedMessage
      )
      const base64UnblindedSig = await blsBlindingClient.unblindAndVerifyMessage(base64BlindSig)

      await expect(
        getObfuscatedIdentifier(
          mockOffchainIdentifier,
          IdentifierPrefix.TWITTER,
          mockAccount,
          authSigner,
          serviceContext
        )
      ).resolves.toMatchObject({
        plaintextIdentifier: mockOffchainIdentifier,
        pepper: expectedPepper,
        obfuscatedIdentifier: expectedIdentifierHash,
        unblindedSignature: base64UnblindedSig,
      })
    })

    it('Preblinding the off-chain identifier', async () => {
      fetchMock.mock(endpoint, {
        success: true,
        signature: '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A',
        performedQueryCount: 5,
        totalQuota: 10,
        version: '',
      })

      const blsBlindingClient = new WasmBlsBlindingClient(serviceContext.odisPubKey)
      const base64BlindedMessage = await getBlindedIdentifier(
        mockOffchainIdentifier,
        IdentifierPrefix.TWITTER,
        blsBlindingClient
      )

      const base64BlindSig = await getBlindedIdentifierSignature(
        mockAccount,
        authSigner,
        serviceContext,
        base64BlindedMessage
      )

      const obfuscatedIdentifierDetails = await getObfuscatedIdentifierFromSignature(
        mockOffchainIdentifier,
        IdentifierPrefix.TWITTER,
        base64BlindSig,
        blsBlindingClient
      )

      expect(obfuscatedIdentifierDetails.obfuscatedIdentifier).toEqual(expectedIdentifierHash)
      expect(obfuscatedIdentifierDetails.pepper).toEqual(expectedPepper)
    })
  })

  it('Throws quota error', async () => {
    fetchMock.mock(endpoint, 403)

    await expect(
      getObfuscatedIdentifier(
        mockOffchainIdentifier,
        IdentifierPrefix.PHONE_NUMBER,
        mockAccount,
        authSigner,
        serviceContext
      )
    ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  })

  it('Throws auth error', async () => {
    fetchMock.mock(endpoint, 401)
    await expect(
      getObfuscatedIdentifier(
        mockOffchainIdentifier,
        IdentifierPrefix.PHONE_NUMBER,
        mockAccount,
        authSigner,
        serviceContext
      )
    ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
  })
})

describe(getPepperFromThresholdSignature, () => {
  it('Hashes sigs correctly', () => {
    const base64Sig = 'vJeFZJ3MY5KlpI9+kIIozKkZSR4cMymLPh2GHZUatWIiiLILyOcTiw2uqK/LBReA'
    const signature = Buffer.from(base64Sig, 'base64')
    expect(getPepperFromThresholdSignature(signature)).toBe('piWqRHHYWtfg9')
  })
})
