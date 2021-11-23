import threshold_bls from 'blind-threshold-bls'
import {
  BLSCryptographyClient,
  ServicePartialSignature,
} from '../../src/bls/bls-cryptography-client'
import config from '../../src/config'

// From Alfajores
const PUBLIC_KEY =
  'kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA'
const PUBLIC_POLYNOMIAL =
  '020000000000000090fa11c56744759fcd777b909e9dc5245b39e33ba24be92caaf3a6f71f2f63a2873c6f23adfab2b2f211534c2da98b01280ed2a00b0808c06ff02fc56f66690ceaa14aabebfec65b6681e641fbdbaabcdbb4320fbd422b1e0452d3274908cb00f3d2ba1d64ddc12f387ef5c6fb98265cee27afa66626edf91b9839d49f23890d75a550a49a2e7a75b06b3b49734a160035558eb2079c41926388ac560e75f1962dada39e5c30ba35bef59eb84ff4329432cdc10383b4dea40f5ad8fabbb09a81'
const SIGNATURES = ['TODO', 'TODO', 'TODO', 'TODO']
const COMBINED_SIGNATURE = 'TODO'

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
      await blsCryptoClient.addSignature(signatures[i])
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
    const publicKey = Buffer.from(PUBLIC_KEY, 'hex')
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
    await signatures.forEach(async (signature) => {
      await blsCryptoClient.addSignature(signature)
    })
    const actual = await blsCryptoClient.combinePartialBlindedSignatures(blindedMsg)
    expect(actual).toEqual(COMBINED_SIGNATURE)

    const unblindedSignedMessage = threshold_bls.unblind(
      Buffer.from(actual, 'base64'),
      blindedMsgResult.blindingFactor
    )
    const publicKey = Buffer.from(PUBLIC_KEY, 'hex')
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
    await signatures.forEach(async (signature) => {
      await blsCryptoClient.addSignature(signature)
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
    await blsCryptoClient.addSignature(signatures[0])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeFalsy()
    await blsCryptoClient.addSignature(signatures[1])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeFalsy()
    await blsCryptoClient.addSignature(signatures[2])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeTruthy()
    // Should fail since 1/3 sigs are invalid
    try {
      await blsCryptoClient.combinePartialBlindedSignatures(blindedMsg)
    } catch (e: any) {
      expect(e.message.includes('Not enough partial signatures')).toBeTruthy()
    }
    // Should be false, now that the invalid signature has been removed
    expect(blsCryptoClient.hasSufficientSignatures()).toBeFalsy()

    await blsCryptoClient.addSignature(signatures[3])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeTruthy()
    const actual = await blsCryptoClient.combinePartialBlindedSignatures(blindedMsg)
    expect(actual).toEqual(COMBINED_SIGNATURE)

    const unblindedSignedMessage = threshold_bls.unblind(
      Buffer.from(actual, 'base64'),
      blindedMsgResult.blindingFactor
    )
    const publicKey = Buffer.from(PUBLIC_KEY, 'hex')
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
        // Invalid partial signature. Combination will succeed but verification of the combined signature will fail.
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
    await blsCryptoClient.addSignature(signatures[0])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeFalsy()
    await blsCryptoClient.addSignature(signatures[1])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeFalsy()
    await blsCryptoClient.addSignature(signatures[2])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeTruthy()
    // Should fail since signature from url3 was generated with the wrong key version
    try {
      await blsCryptoClient.combinePartialBlindedSignatures(blindedMsg)
    } catch (e: any) {
      expect(e.message.includes('Not enough partial signatures')).toBeTruthy()
    }

    // Should be false, now that the invalid partial signature has been removed
    expect(blsCryptoClient.hasSufficientSignatures()).toBeFalsy()

    await blsCryptoClient.addSignature(signatures[3])
    expect(blsCryptoClient.hasSufficientSignatures()).toBeTruthy()
    const actual = await blsCryptoClient.combinePartialBlindedSignatures(blindedMsg)
    expect(actual).toEqual(COMBINED_SIGNATURE)

    const unblindedSignedMessage = threshold_bls.unblind(
      Buffer.from(actual, 'base64'),
      blindedMsgResult.blindingFactor
    )
    const publicKey = Buffer.from(PUBLIC_KEY, 'hex')
    expect(threshold_bls.verify(publicKey, message, unblindedSignedMessage))
  })
})
