import threshold_bls from 'blind-threshold-bls'
import {
  BLSCryptographyClient,
  ServicePartialSignature,
} from '../../src/bls/bls-cryptography-client'
import config from '../../src/config'

config.thresholdSignature = {
  threshold: 3,
  polynomial:
    '0300000000000000813a7deecc0f058cc804358efbcd83f84dfeddcaec0a0b601e73b74d7dead680b8b1d7b65769026512b8c7438c95a401c3ce218d454222948e782656ef5b37aabbe78ace335731afe5213cb07d26eebb093741ebde38296206893a2c217e4601951925ca9e2ce2938accdad680cdd77e6b533433c6b37dd0d63f67088468a8924d0b138a2a3457067bb0395658cb1001998aa2e4f954b7895ff15ea7c2b46bf582a0d1e3bdc971f3c294e1aebd4064194cf2efa01650f0066e1d49d57c330101c0e3923a3d394a4b3a6084d18e6bf404d3a9373aac5376cc9548634a368e9a6bc0f8669546873a079ce38a03541c9201b6308ac34b704cb14c306c90f692ede068e130295f789f5a1ca08223d7c7ff0b9edff0e2b5e36918087f8059d018a100',
}

const PUBLIC_KEY =
  '813a7deecc0f058cc804358efbcd83f84dfeddcaec0a0b601e73b74d7dead680b8b1d7b65769026512b8c7438c95a401c3ce218d454222948e782656ef5b37aabbe78ace335731afe5213cb07d26eebb093741ebde38296206893a2c217e4601'

describe(`BLS service computes signature`, () => {
  it('provides blinded signature', async () => {
    const signatures: ServicePartialSignature[] = [
      {
        url: 'url1',
        signature:
          'MAAAAAAAAABMnIduYMm1JmaOWWgybOTc6rB7+eunT9h21RL2oTId3KSOH1OjAglgOpI6cjizLQEAAAAA',
      },
      {
        url: 'url2',
        signature:
          'MAAAAAAAAAAl0tkxryWcl83IV1I7DoMIoI/oSz2ogIy7LW5G3tg0ksifa5rdgxFfv4Y9GbQsBoEBAAAA',
      },
      {
        url: 'url3',
        signature:
          'MAAAAAAAAAD60iBC0rpJd9A+FjDzVix/xjdD5Rq8+euqX/pTJuwzooTXu/9+KBztQruAAAYWtAACAAAA',
      },
      {
        url: 'url4',
        signature:
          'MAAAAAAAAADNYzSf29At1wxuqPXcvNYsYObrxZTmPXgg0KBH+BZm1lLczhv8NpedtgkPjX+GvwADAAAA',
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
      await blsCryptoClient.addSignature(signatures[i], blindedMsg)
      if (i >= 2) {
        expect(blsCryptoClient.hasSufficientVerifiedSignatures()).toBeTruthy()
      } else {
        expect(blsCryptoClient.hasSufficientVerifiedSignatures()).toBeFalsy()
      }
    }

    const actual = await blsCryptoClient.combinePartialBlindedSignatures()
    expect(actual).toEqual('vy4TFsSNeyNsQK/xjGoH2TwLRI9ZCOiyvfMU7aRLJYw/oOIF/xCrBiwpK9gwLTQA')

    const unblindedSignedMessage = threshold_bls.unblind(
      Buffer.from(actual, 'base64'),
      blindedMsgResult.blindingFactor
    )
    const publicKey = Buffer.from(PUBLIC_KEY, 'hex')
    expect(threshold_bls.verify(publicKey, message, unblindedSignedMessage))
  })
  it('provides blinded signature if one failure if still above threshold', async () => {
    const signatures: ServicePartialSignature[] = [
      {
        url: 'url1',
        signature:
          'MAAAAAAAAABMnIduYMm1JmaOWWgybOTc6rB7+eunT9h21RL2oTId3KSOH1OjAglgOpI6cjizLQEAAAAA',
      },
      {
        url: 'url2',
        signature: 'X',
      },
      {
        url: 'url3',
        signature:
          'MAAAAAAAAAD60iBC0rpJd9A+FjDzVix/xjdD5Rq8+euqX/pTJuwzooTXu/9+KBztQruAAAYWtAACAAAA',
      },
      {
        url: 'url4',
        signature:
          'MAAAAAAAAADNYzSf29At1wxuqPXcvNYsYObrxZTmPXgg0KBH+BZm1lLczhv8NpedtgkPjX+GvwADAAAA',
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
      await blsCryptoClient.addSignature(signature, blindedMsg)
    })
    const actual = await blsCryptoClient.combinePartialBlindedSignatures()
    expect(actual).toEqual('vy4TFsSNeyNsQK/xjGoH2TwLRI9ZCOiyvfMU7aRLJYw/oOIF/xCrBiwpK9gwLTQA')

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
        signature:
          'MAAAAAAAAABMnIduYMm1JmaOWWgybOTc6rB7+eunT9h21RL2oTId3KSOH1OjAglgOpI6cjizLQEAAAAA',
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
        signature:
          'MAAAAAAAAADNYzSf29At1wxuqPXcvNYsYObrxZTmPXgg0KBH+BZm1lLczhv8NpedtgkPjX+GvwADAAAA',
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
      await blsCryptoClient.addSignature(signature, blindedMsg)
    })
    try {
      await blsCryptoClient.combinePartialBlindedSignatures()
    } catch (e) {
      expect(e.message.includes('Not enough not enough partial signatures'))
    }
  })
})
