import threshold_bls from 'blind-threshold-bls'
import { computeBlindedSignature } from '../../src/bls/bls-cryptography-client'
import { DEV_POLYNOMIAL, DEV_PRIVATE_KEY, DEV_PUBLIC_KEY } from '../../src/config'

describe(`BLS service computes signature`, () => {
  it('provides blinded signature', async () => {
    const message = Buffer.from('hello world')
    const userSeed = new Uint8Array(32)
    for (let i = 0; i < userSeed.length - 1; i++) {
      userSeed[i] = i
    }

    const blindedMsgResult = threshold_bls.blind(message, userSeed)
    const blindedMsg = Buffer.from(blindedMsgResult.message).toString('base64')

    const actual = await computeBlindedSignature(blindedMsg, DEV_PRIVATE_KEY)
    expect(actual).toEqual(
      'MAAAAAAAAADDilSaA/xvbtE4NV3agMzHIf8PGPQ83Cu8gQy5E2mRWyUIges8bjE4EBe1L7pcY4AAAAAA'
    )

    expect(
      threshold_bls.partialVerifyBlindSignature(
        Buffer.from(DEV_POLYNOMIAL, 'hex'),
        blindedMsgResult.message,
        Buffer.from(actual, 'base64')
      )
    )

    const combinedSignature = threshold_bls.combine(1, Buffer.from(actual, 'base64'))
    const unblindedSignedMessage = threshold_bls.unblind(
      combinedSignature,
      blindedMsgResult.blindingFactor
    )
    const publicKey = Buffer.from(DEV_PUBLIC_KEY, 'hex')
    expect(threshold_bls.verify(publicKey, message, unblindedSignedMessage))
  })

  it('invalid blind message throws an error', async () => {
    const blindedMsg = Buffer.from('invalid blinded message').toString('base64')

    expect.assertions(1)
    await expect(() => computeBlindedSignature(blindedMsg, DEV_PRIVATE_KEY)).toThrow()
  })
})
