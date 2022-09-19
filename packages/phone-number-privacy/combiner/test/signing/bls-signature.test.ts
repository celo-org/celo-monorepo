import threshold_bls from 'blind-threshold-bls'
import {
  BLSCryptographyClient,
  ServicePartialSignature,
} from '../../src/bls/bls-cryptography-client'
import config from '../../src/config'

const PUBLIC_KEY =
  '8VZ0ZBPBjeRaH2nE+itNKiL/wKl38foK74MniCCIxvpA/9AfE1Uy7qbGGRyiKj8AAeiFpSaMzi7Flfe/Tj/qCWM8LMgQGR+eTvt7yiYsyKIVpGMJYVyzchEtPwFZyRyA'
const PUBLIC_POLYNOMIAL =
  '0300000000000000f156746413c18de45a1f69c4fa2b4d2a22ffc0a977f1fa0aef8327882088c6fa40ffd01f135532eea6c6191ca22a3f0001e885a5268cce2ec595f7bf4e3fea09633c2cc810191f9e4efb7bca262cc8a215a46309615cb372112d3f0159c91c80ececfb0ecd57116e44c7580b57fe7c3f0f566d65f789f041b9febd83d3497e4c430af250cf8ac135f4782d283f3dd5009cf6e8de23a35be1cc21a8504ee2e3757a36f6c9813137d0f6b8aa75febc5ee77435cfd4280de80647670a60683e9481f091088a9940142b31d42ed3981dd548910fa41364f589c93c87bf62725468779a1442785600c08efbeff391f84e3200560dcd95d055998f4ef803a820356ef5b756cc75a98286bd21b5675cfe2db9bac0bcee64dc94c435d92aa5fbfa118680'
const SIGNATURES = [
  'MAAAAAAAAADkHsKIX91BuKRjNgsJR81otwGGln4HuguYe4QkZoInFwNIiU9QglFZeLpJmNEysIAAAAAA',
  'MAAAAAAAAABqscf+GUMQD5I8SJW+zzZKuo83gyRZs/RUR7zePSDx4ZtewOGEc/VThpUpqgM5mAEBAAAA',
  'MAAAAAAAAABH006sJMay5D4OtOHDdQh3W8gX7yafeyMSGJzba7RhBAWatCEztthuQ6gSEOYTYQECAAAA',
  'MAAAAAAAAAAhzTl/S+mldhE+5F5rt+2XKJQsNtELZeo+aoHjhsVVdw8Ofk1ZRr9EUZbvVKetNYADAAAA',
]
const COMBINED_SIGNATURE = '16RcENpbLgq5pIkcPWdgnMofeLqSyuUVin9h4jof9/I8GRsmt5iRxjWAkpftKPWA'
const INVALID_SIGNATURE =
  'MAAAAAAAAACanrA73tApLu+j569ICcXrEBRLi4czWJtInJPSUpoZUOVDc1667hvMq1ESncFzlgEHAAAA'

config.thresholdSignature = {
  threshold: 3,
  polynomial: PUBLIC_POLYNOMIAL,
  pubKey: PUBLIC_KEY,
}

describe(`BLS service computes signature`, () => {
  it('provides blinded signature', async () => {
    const signatures: ServicePartialSignature[] = [
      {
        url: 'url1',
        signature: SIGNATURES[0],
      },
      {
        url: 'url2',
        signature: SIGNATURES[1],
      },
      {
        url: 'url3',
        signature: SIGNATURES[2],
      },
      {
        url: 'url4',
        signature: SIGNATURES[3],
      },
    ]

    const message = Buffer.from('hello world')
    const userSeed = new Uint8Array(32)
    for (let i = 0; i < userSeed.length - 1; i++) {
      userSeed[i] = i
    }

    const blindedMsgResult = threshold_bls.blind(message, userSeed)
    const blindedMsg = Buffer.from(blindedMsgResult.message).toString('base64')

    const blsCryptoClient = new BLSCryptographyClient()
    for (let i = 0; i < signatures.length; i++) {
      blsCryptoClient.addSignature(signatures[i])
      if (i >= 2) {
        expect(blsCryptoClient.hasSufficientSignatures()).toBeTruthy()
      } else {
        expect(blsCryptoClient.hasSufficientSignatures()).toBeFalsy()
      }
    }

    const actual = await blsCryptoClient.combinePartialBlindedSignatures(blindedMsg)
    expect(actual).toEqual(COMBINED_SIGNATURE)

    const unblindedSignedMessage = threshold_bls.unblind(
      Buffer.from(actual, 'base64'),
      blindedMsgResult.blindingFactor
    )
    const publicKey = Buffer.from(PUBLIC_KEY, 'base64')
    expect(threshold_bls.verify(publicKey, message, unblindedSignedMessage))
  })
  it('provides blinded signature given one failure if still above threshold', async () => {
    const signatures: ServicePartialSignature[] = [
      {
        url: 'url1',
        signature: SIGNATURES[0],
      },
      {
        url: 'url2',
        signature: 'X', // This input causes signature combination to fail
      },
      {
        url: 'url3',
        signature: SIGNATURES[2],
      },
      {
        url: 'url4',
        signature: SIGNATURES[3],
      },
    ]

    const message = Buffer.from('hello world')
    const userSeed = new Uint8Array(32)
    for (let i = 0; i < userSeed.length - 1; i++) {
      userSeed[i] = i
    }

    const blindedMsgResult = threshold_bls.blind(message, userSeed)
    const blindedMsg = Buffer.from(blindedMsgResult.message).toString('base64')

    const blsCryptoClient = new BLSCryptographyClient()
    signatures.forEach(async (signature) => {
      blsCryptoClient.addSignature(signature)
    })
    const actual = await blsCryptoClient.combinePartialBlindedSignatures(blindedMsg)
    expect(actual).toEqual(COMBINED_SIGNATURE)

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
        signature: SIGNATURES[0],
      },
      {
        url: 'url2',
        signature: 'X',
      },
      {
        url: 'url3',
        signature: 'X',
      },
      {
        url: 'url4',
        signature: SIGNATURES[3],
      },
    ]

    const message = Buffer.from('hello world')
    const userSeed = new Uint8Array(32)
    for (let i = 0; i < userSeed.length - 1; i++) {
      userSeed[i] = i
    }

    const blindedMsgResult = threshold_bls.blind(message, userSeed)
    const blindedMsg = Buffer.from(blindedMsgResult.message).toString('base64')

    const blsCryptoClient = new BLSCryptographyClient()
    signatures.forEach(async (signature) => {
      blsCryptoClient.addSignature(signature)
    })
    try {
      await blsCryptoClient.combinePartialBlindedSignatures(blindedMsg)
      throw new Error('Expected failure with missing signatures')
    } catch (e: any) {
      expect(e.message.includes('Not enough partial signatures')).toBeTruthy()
    }
  })
  it('throws error if signature cannot be combined, but can recover from failure with sufficient signatures', async () => {
    const signatures: ServicePartialSignature[] = [
      {
        url: 'url1',
        signature: SIGNATURES[0],
      },
      {
        url: 'url2',
        signature: 'X', // This input causes signature combination to fail
      },
      {
        url: 'url3',
        signature: SIGNATURES[2],
      },
      {
        url: 'url4',
        signature: SIGNATURES[3],
      },
    ]

    const message = Buffer.from('hello world')
    const userSeed = new Uint8Array(32)
    for (let i = 0; i < userSeed.length - 1; i++) {
      userSeed[i] = i
    }

    const blindedMsgResult = threshold_bls.blind(message, userSeed)
    const blindedMsg = Buffer.from(blindedMsgResult.message).toString('base64')

    const blsCryptoClient = new BLSCryptographyClient()
    // Add sigs one-by-one and verify intermediary states
    blsCryptoClient.addSignature(signatures[0])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeFalsy()
    blsCryptoClient.addSignature(signatures[1])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeFalsy()
    blsCryptoClient.addSignature(signatures[2])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeTruthy()
    // Should fail since 1/3 sigs are invalid
    try {
      await blsCryptoClient.combinePartialBlindedSignatures(blindedMsg)
    } catch (e: any) {
      expect(e.message.includes('Not enough partial signatures')).toBeTruthy()
    }
    // Should be false, now that the invalid signature has been removed
    expect(blsCryptoClient.hasSufficientSignatures()).toBeFalsy()

    blsCryptoClient.addSignature(signatures[3])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeTruthy()
    const actual = await blsCryptoClient.combinePartialBlindedSignatures(blindedMsg)
    expect(actual).toEqual(COMBINED_SIGNATURE)

    const unblindedSignedMessage = threshold_bls.unblind(
      Buffer.from(actual, 'base64'),
      blindedMsgResult.blindingFactor
    )
    const publicKey = Buffer.from(PUBLIC_KEY, 'base64')
    expect(threshold_bls.verify(publicKey, message, unblindedSignedMessage))
  })
  it('throws error if combined signature is invalid, and can recover from failure with sufficient valid partial signatures', async () => {
    const signatures: ServicePartialSignature[] = [
      {
        url: 'url1',
        signature: SIGNATURES[0],
      },
      {
        url: 'url2',
        signature: SIGNATURES[1],
      },
      {
        url: 'url3',
        signature: INVALID_SIGNATURE, // Combination will succeed but verification will fail.
      },
      {
        url: 'url4',
        signature: SIGNATURES[3],
      },
    ]

    const message = Buffer.from('hello world')
    const userSeed = new Uint8Array(32)
    for (let i = 0; i < userSeed.length - 1; i++) {
      userSeed[i] = i
    }

    const blindedMsgResult = threshold_bls.blind(message, userSeed)
    const blindedMsg = Buffer.from(blindedMsgResult.message).toString('base64')

    const blsCryptoClient = new BLSCryptographyClient()
    // Add sigs one-by-one and verify intermediary states
    blsCryptoClient.addSignature(signatures[0])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeFalsy()
    blsCryptoClient.addSignature(signatures[1])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeFalsy()
    blsCryptoClient.addSignature(signatures[2])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeTruthy()
    // Should fail since signature from url3 was generated with the wrong key version
    try {
      await blsCryptoClient.combinePartialBlindedSignatures(blindedMsg)
    } catch (e: any) {
      expect(e.message.includes('Not enough partial signatures')).toBeTruthy()
    }

    // Should be false, now that the invalid partial signature has been removed
    expect(blsCryptoClient.hasSufficientSignatures()).toBeFalsy()

    blsCryptoClient.addSignature(signatures[3])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeTruthy()
    const actual = await blsCryptoClient.combinePartialBlindedSignatures(blindedMsg)
    expect(actual).toEqual(COMBINED_SIGNATURE)

    const unblindedSignedMessage = threshold_bls.unblind(
      Buffer.from(actual, 'base64'),
      blindedMsgResult.blindingFactor
    )
    const publicKey = Buffer.from(PUBLIC_KEY, 'base64')
    expect(threshold_bls.verify(publicKey, message, unblindedSignedMessage))
  })
})
