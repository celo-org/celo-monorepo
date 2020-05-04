import threshold from 'blind-threshold-bls'
import { BLSCryptographyClient } from '../../src/bls/bls-cryptography-client'
import config, { DEV_PRIVATE_KEY, DEV_PUBLIC_KEY } from '../../src/config'

const USING_MOCK = config.keyVault.azureClientSecret === 'useMock'

describe(`BLS service computes signature`, () => {
  beforeEach(() => {
    // Use mock client if env vars not specified
    if (!USING_MOCK) {
      // Ensure all env vars are specified
      expect(config.keyVault.azureClientID).not.toBe('useMock')
      expect(config.keyVault.azureClientSecret).not.toBe('useMock')
      expect(config.keyVault.azureTenant).not.toBe('useMock')
      expect(config.keyVault.azureVaultName).not.toBe('useMock')
      expect(config.keyVault.azureSecretName).not.toBe('useMock')
    }
    if (USING_MOCK) {
      jest.spyOn<any, any>(BLSCryptographyClient, 'getPrivateKey').mockImplementation(() => {
        return DEV_PRIVATE_KEY
      })
    }
  })

  it('provides blinded signature', async () => {
    const message = Buffer.from('hello world')
    const userSeed = new Uint8Array(32)
    for (let i = 0; i < 31; i++) {
      userSeed[i] = i
    }

    const blindedMsgResult = threshold.blind(message, userSeed)
    const blindedMsg = Buffer.from(blindedMsgResult.message).toString('base64')

    const actual = await BLSCryptographyClient.computeBlindedSignature(blindedMsg)
    expect(actual).toEqual('ZeYBwDBxkWe1ZNDqiViz2MNGIT6PIW2c3pemkMcmM5gM1vaaf5RieVp+2SxR83YA')

    const unblindedSignedMessage = threshold.unblind(
      Buffer.from(actual, 'base64'),
      blindedMsgResult.blindingFactor
    )
    const publicKey = Buffer.from(DEV_PUBLIC_KEY, 'base64')
    expect(threshold.verify(publicKey, message, unblindedSignedMessage))
  })
})
