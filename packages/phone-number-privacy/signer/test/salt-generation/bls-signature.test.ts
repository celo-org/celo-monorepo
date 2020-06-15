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
      'MAAAAAAAAADJpFrx/eDNs1Qm986trWFZpMcJNRM5W/yKoI+cxk0gBul1PNAVzw1uFpEWJx5iK4EAAAAA'
    )

    expect(
      threshold_bls.partialVerifyBlindSignature(
        Buffer.from(DEV_POLYNOMIAL, 'base64'),
        blindedMsgResult.message,
        Buffer.from(actual, 'base64')
      )
    )

    const combinedSignature = threshold_bls.combine(1, Buffer.from(actual, 'base64'))
    const unblindedSignedMessage = threshold_bls.unblind(
      combinedSignature,
      blindedMsgResult.blindingFactor
    )
    const publicKey = Buffer.from(DEV_PUBLIC_KEY, 'base64')
    expect(threshold_bls.verify(publicKey, message, unblindedSignedMessage))
  })
})
