import { migrations } from 'src/redux/migrations'
import { v0Schema, v1Schema, v2Schema, vNeg1Schema } from 'test/schemas'

describe('Redux persist migrations', () => {
  it('works for v-1 to v0', () => {
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

  it('works for v0 to v1', () => {
    const mockNumber = '+111111111111'
    const mockAddress = '0x00000000000000000000'
    const v0Stub = {
      ...v0Schema,
      invite: {
        ...v0Schema.invite,
        invitees: {
          [mockAddress]: mockNumber,
        },
      },
    }
    const migratedSchema = migrations[1](v0Stub)
    expect(migratedSchema.invite.invitees[0].tempWalletAddress).toEqual(mockAddress)
  })

  it('works for v1 to v2', () => {
    const v1Stub = {
      ...v1Schema,
      app: {
        ...v1Schema.app,
        numberVerified: true,
      },
    }
    const migratedSchema = migrations[2](v1Stub)
    expect(migratedSchema.app.numberVerified).toEqual(false)
  })

  it('works for v2 to v3', () => {
    const v2Stub = {
      ...v2Schema,
      send: {
        ...v2Schema.send,
        recentPayments: [{ timestamp: Date.now(), amount: '100' }],
      },
      account: {
        ...v2Schema.account,
        hasMigratedToNewBip39: false,
      },
    }
    const migratedSchema = migrations[3](v2Stub)
    expect(migratedSchema.send.recentPayments.length).toEqual(0)
  })
})
