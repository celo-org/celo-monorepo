import { migrations } from 'src/redux/migrations'
import { vNeg1Schema } from 'test/schemas'

describe('Redux persist migrations', () => {
  it('work for v-1 to v0', () => {
    const mockNumber = '+111111111111'
    const mockAddress = '0x00000000000000000000'
    const vNeg1Stub = {
      ...vNeg1Schema,
      identity: {
        ...vNeg1Schema.identity,
        e164NumberToAddress: { [mockNumber]: mockAddress },
      },
    }
    const migratedSchema = migrations[0](vNeg1Stub)
    expect(migratedSchema.identity.e164NumberToAddress).toEqual({ [mockNumber]: [mockAddress] })
  })
})
