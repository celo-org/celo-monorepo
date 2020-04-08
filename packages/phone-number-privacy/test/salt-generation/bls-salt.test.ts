import { BLINDBLS } from 'bls12377js-blind'
import { computeBLSSalt } from '../../src/salt-generation/bls-salt'

describe(`BLS service computes salt`, () => {
  it('provides blinded salt', () => {
    const queryPhoneNumber = '5555555555'
    // Expected value derived by making request unblinded
    const expected = new Buffer([
      32,
      0,
      241,
      248,
      26,
      82,
      158,
      240,
      207,
      29,
      190,
      11,
      146,
      20,
      137,
      179,
      213,
      92,
      65,
      197,
      234,
      156,
      161,
      235,
      152,
      151,
      187,
      143,
      22,
      38,
      208,
      225,
      92,
      3,
      207,
      27,
      80,
      114,
      40,
      148,
      250,
      84,
      197,
      93,
      212,
      240,
      29,
      129,
    ])
    const blindingFactor = BLINDBLS.generateBlindingFactor()
    const blindedPhoneNumber = BLINDBLS.blindMessage(new Buffer(queryPhoneNumber), blindingFactor)

    expect(
      JSON.stringify(
        BLINDBLS.unblindMessage(computeBLSSalt(blindedPhoneNumber as any), blindingFactor)
      )
    ).toEqual(JSON.stringify(expected))
  })
})
