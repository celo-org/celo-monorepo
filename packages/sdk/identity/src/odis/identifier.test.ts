import { CombinerEndpoint } from '@celo/phone-number-privacy-common'
import { WasmBlsBlindingClient } from './bls-blinding-client'
import {
  getBlindedIdentifier,
  getBlindedIdentifierSignature,
  getOnchainIdentifier,
  getOnchainIdentifierFromSignature,
  getPepperFromThresholdSignature,
  IdentifierType,
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

const mockOffchainIdentifier = '+14155550000'
const mockAccount = '0x0000000000000000000000000000000000007E57'
const expectedIdentifierHash = '0xf3ddadd1f488cdd42b9fa10354fdcae67c303ce182e71b30855733b50dce8301'
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

describe(getOnchainIdentifier, () => {
  afterEach(() => {
    fetchMock.reset()
  })

  describe('Retrieves a pepper correctly', () => {
    it('Using EncryptionKeySigner', async () => {
      fetchMock.mock(endpoint, {
        success: true,
        combinedSignature: '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A',
      })

      const blsBlindingClient = new WasmBlsBlindingClient(serviceContext.odisPubKey)
      const base64BlindedMessage = await getBlindedIdentifier(
        mockOffchainIdentifier,
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
        getOnchainIdentifier(
          mockOffchainIdentifier,
          IdentifierType.PHONE_NUMBER,
          mockAccount,
          authSigner,
          serviceContext
        )
      ).resolves.toMatchObject({
        offchainIdentifier: mockOffchainIdentifier,
        pepper: expectedPepper,
        identifierHash: expectedIdentifierHash,
        unblindedSignature: base64UnblindedSig,
      })
    })

    it('Preblinding the of-chain identifier', async () => {
      fetchMock.mock(endpoint, {
        success: true,
        combinedSignature: '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A',
      })

      const blsBlindingClient = new WasmBlsBlindingClient(serviceContext.odisPubKey)
      const base64BlindedMessage = await getBlindedIdentifier(
        mockOffchainIdentifier,
        blsBlindingClient
      )

      const base64BlindSig = await getBlindedIdentifierSignature(
        mockAccount,
        authSigner,
        serviceContext,
        base64BlindedMessage
      )

      const identifierHashDetails = await getOnchainIdentifierFromSignature(
        mockOffchainIdentifier,
        IdentifierType.PHONE_NUMBER,
        base64BlindSig,
        blsBlindingClient
      )

      expect(identifierHashDetails.identifierHash).toEqual(expectedIdentifierHash)
      expect(identifierHashDetails.pepper).toEqual(expectedPepper)
    })
  })

  it('Throws quota error', async () => {
    fetchMock.mock(endpoint, 403)

    await expect(
      getOnchainIdentifier(
        mockOffchainIdentifier,
        IdentifierType.PHONE_NUMBER,
        mockAccount,
        authSigner,
        serviceContext
      )
    ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  })

  it('Throws auth error', async () => {
    fetchMock.mock(endpoint, 401)
    await expect(
      getOnchainIdentifier(
        mockOffchainIdentifier,
        IdentifierType.PHONE_NUMBER,
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
