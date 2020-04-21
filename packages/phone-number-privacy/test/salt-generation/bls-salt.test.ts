import threshold from 'blind-threshold-bls'
import crypto from 'crypto'
import { computeBLSSalt } from '../../src/salt-generation/bls-salt'

describe(`BLS service computes salt`, () => {
  it('provides blinded salt', () => {
    const queryPhoneNumber = '5555555555'
    // Expected value derived by making request unblinded
    const expected =
      '5Xz5pxxni8SCj124ncnGrKkzj5YkTsVpUqp0LhhVnV3BHQOWKEO0r2qVcvjbqYQAL33W2GYojFfzWAJa0gs8MiaoHojTzH1sWuWnz3JhW5V0LeMSpPncy62TvPyqGpYAvm1WwEH1PBWL1tf8lvcHgH0/YlzVR7eOhSnhCYSVUzLptT+2+7HWKFJCidx8HmQBqXpk/ICuRXfntBiinY+gaNPTWryO4EBpXfK3UE+kiNwCqqrym6RcSFNaN6FA2CAAAA=='
    const blindingFactor = crypto.randomBytes(32)
    const blindedPhoneNumber = threshold.blind(
      new Buffer(queryPhoneNumber, 'base64'),
      blindingFactor
    )
    const blindPhoneNumberString = Buffer.from(blindedPhoneNumber.message).toString('base64')

    expect(
      JSON.stringify(
        Buffer.from(
          threshold.unblind(
            new Buffer(computeBLSSalt(blindPhoneNumberString), 'base64'),
            blindedPhoneNumber.blindingFactor
          )
        ).toString('base64')
      )
    ).toEqual(JSON.stringify(expected))
  })
})
