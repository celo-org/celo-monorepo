import threshold_bls from 'blind-threshold-bls'
import {
  BLSCryptographyClient,
  ServicePartialSignature,
} from '../../src/bls/bls-cryptography-client'
import config from '../../src/config'

const USING_MOCK = config.keyVault.azureClientSecret === 'useMock'

config.thresholdSignature = {
  threshold: 3,
  polynomial:
    'AwAAAAAAAADxVnRkE8GN5FofacT6K00qIv/AqXfx+grvgyeIIIjG+kD/0B8TVTLupsYZHKIqPwAB6IWlJozOLsWV979OP+oJYzwsyBAZH55O+3vKJizIohWkYwlhXLNyES0/AVnJHIDs7PsOzVcRbkTHWAtX/nw/D1ZtZfeJ8EG5/r2D00l+TEMK8lDPisE19HgtKD891QCc9ujeI6Nb4cwhqFBO4uN1ejb2yYExN9D2uKp1/rxe53Q1z9QoDegGR2cKYGg+lIHwkQiKmUAUKzHULtOYHdVIkQ+kE2T1ick8h79iclRod5oUQnhWAMCO++/zkfhOMgBWDc2V0FWZj074A6ggNW71t1bMdamChr0htWdc/i25usC87mTclMQ12Sql+/oRhoA=',
}

const PUBLIC_KEY =
  '8VZ0ZBPBjeRaH2nE+itNKiL/wKl38foK74MniCCIxvpA/9AfE1Uy7qbGGRyiKj8AAeiFpSaMzi7Flfe/Tj/qCWM8LMgQGR+eTvt7yiYsyKIVpGMJYVyzchEtPwFZyRyA'

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
  })

  it('provides blinded signature', async () => {
    const signatures: ServicePartialSignature[] = [
      {
        url: 'url1',
        signature:
          'MAAAAAAAAADkHsKIX91BuKRjNgsJR81otwGGln4HuguYe4QkZoInFwNIiU9QglFZeLpJmNEysIAAAAAA',
      },
      {
        url: 'url2',
        signature:
          'MAAAAAAAAABqscf+GUMQD5I8SJW+zzZKuo83gyRZs/RUR7zePSDx4ZtewOGEc/VThpUpqgM5mAEBAAAA',
      },
      {
        url: 'url3',
        signature:
          'MAAAAAAAAABH006sJMay5D4OtOHDdQh3W8gX7yafeyMSGJzba7RhBAWatCEztthuQ6gSEOYTYQECAAAA',
      },
      {
        url: 'url4',
        signature:
          'MAAAAAAAAAAhzTl/S+mldhE+5F5rt+2XKJQsNtELZeo+aoHjhsVVdw8Ofk1ZRr9EUZbvVKetNYADAAAA',
      },
    ]

    const message = Buffer.from('hello world')
    const userSeed = new Uint8Array(32)
    for (let i = 0; i < userSeed.length - 1; i++) {
      userSeed[i] = i
    }

    const blindedMsgResult = threshold_bls.blind(message, userSeed)
    const blindedMsg = Buffer.from(blindedMsgResult.message).toString('base64')

    const actual = await BLSCryptographyClient.combinePartialBlindedSignatures(
      signatures,
      blindedMsg
    )
    expect(actual).toEqual('16RcENpbLgq5pIkcPWdgnMofeLqSyuUVin9h4jof9/I8GRsmt5iRxjWAkpftKPWA')

    const unblindedSignedMessage = threshold_bls.unblind(
      Buffer.from(actual, 'base64'),
      blindedMsgResult.blindingFactor
    )
    const publicKey = Buffer.from(PUBLIC_KEY, 'base64')
    expect(threshold_bls.verify(publicKey, message, unblindedSignedMessage))
  })
  it('provides blinded signature if one failure if still above threshold', async () => {
    const signatures: ServicePartialSignature[] = [
      {
        url: 'url1',
        signature:
          'MAAAAAAAAADkHsKIX91BuKRjNgsJR81otwGGln4HuguYe4QkZoInFwNIiU9QglFZeLpJmNEysIAAAAAA',
      },
      { url: 'url2', signature: 'X' },
      {
        url: 'url3',
        signature:
          'MAAAAAAAAABH006sJMay5D4OtOHDdQh3W8gX7yafeyMSGJzba7RhBAWatCEztthuQ6gSEOYTYQECAAAA',
      },
      {
        url: 'url4',
        signature:
          'MAAAAAAAAAAhzTl/S+mldhE+5F5rt+2XKJQsNtELZeo+aoHjhsVVdw8Ofk1ZRr9EUZbvVKetNYADAAAA',
      },
    ]

    const message = Buffer.from('hello world')
    const userSeed = new Uint8Array(32)
    for (let i = 0; i < userSeed.length - 1; i++) {
      userSeed[i] = i
    }

    const blindedMsgResult = threshold_bls.blind(message, userSeed)
    const blindedMsg = Buffer.from(blindedMsgResult.message).toString('base64')

    const actual = await BLSCryptographyClient.combinePartialBlindedSignatures(
      signatures,
      blindedMsg
    )
    expect(actual).toEqual('16RcENpbLgq5pIkcPWdgnMofeLqSyuUVin9h4jof9/I8GRsmt5iRxjWAkpftKPWA')

    const unblindedSignedMessage = threshold_bls.unblind(
      Buffer.from(actual, 'base64'),
      blindedMsgResult.blindingFactor
    )
    const publicKey = Buffer.from(PUBLIC_KEY, 'base64')
    expect(threshold_bls.verify(publicKey, message, unblindedSignedMessage))
  })
  it('throws error if does not meet threshold signatures', async () => {
    const signatures: ServicePartialSignature[] = [
      {
        url: 'url1',
        signature:
          'MAAAAAAAAADkHsKIX91BuKRjNgsJR81otwGGln4HuguYe4QkZoInFwNIiU9QglFZeLpJmNEysIAAAAAA',
      },
      { url: 'url2', signature: 'X' },
      { url: 'url3', signature: 'X' },
      {
        url: 'url4',
        signature:
          'MAAAAAAAAAAhzTl/S+mldhE+5F5rt+2XKJQsNtELZeo+aoHjhsVVdw8Ofk1ZRr9EUZbvVKetNYADAAAA',
      },
    ]

    const message = Buffer.from('hello world')
    const userSeed = new Uint8Array(32)
    for (let i = 0; i < userSeed.length - 1; i++) {
      userSeed[i] = i
    }

    const blindedMsgResult = threshold_bls.blind(message, userSeed)
    const blindedMsg = Buffer.from(blindedMsgResult.message).toString('base64')

    try {
      await BLSCryptographyClient.combinePartialBlindedSignatures(signatures, blindedMsg)
    } catch (e) {
      expect(e.message.includes('Not enough not enough partial signatures'))
    }
  })
})
