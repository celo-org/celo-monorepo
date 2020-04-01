import { BLINDBLS } from 'bls12377js-blind'
import { getSalt } from '../src/index'

describe(`POST /getSalt endpoint`, () => {
  it('provides blinded salt', () => {
    const phoneNumber = '5555555555'
    // Expected value derived by making request unblinded
    const expected = new Buffer([
      20,
      170,
      113,
      251,
      54,
      95,
      165,
      23,
      231,
      21,
      33,
      0,
      228,
      65,
      208,
      196,
      248,
      162,
      127,
      147,
      232,
      47,
      224,
      247,
      111,
      57,
      199,
      92,
      130,
      152,
      238,
      236,
      114,
      237,
      189,
      96,
      0,
      3,
      97,
      225,
      158,
      38,
      74,
      16,
      97,
      162,
      143,
      0,
    ])
    const blindingFactor = BLINDBLS.generateBlindingFactor()
    const blindedPhoneNumber = BLINDBLS.blindMessage(new Buffer(phoneNumber), blindingFactor)
    const mockRequestData = {
      blindPhoneNumber: blindedPhoneNumber,
    }
    const req = { body: mockRequestData }

    const res = {
      json: (body: any) => {
        expect(body.success).toEqual(true)
        expect(JSON.stringify(BLINDBLS.unblindMessage(body.salt, blindingFactor))).toEqual(
          JSON.stringify(expected)
        )
      },
    }
    // @ts-ignore TODO fix req type to make it a mock express req
    getSalt(req, res)
  })
})
