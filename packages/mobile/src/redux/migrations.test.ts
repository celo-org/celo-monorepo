import { migrations } from 'src/redux/migrations'
import { getLatestSchema } from 'test/schemas'

describe('Redux persist migrations', () => {
  it('work for v-1 to v0', () => {
    const defaultSchema = getLatestSchema()
    const vNeg1Stub = {
      ...defaultSchema,
      app: {
        ...defaultSchema.app,
        numberVerified: true,
        inviteCodeEntered: true,
      },
    }
    const migratedSchema = migrations[0](vNeg1Stub)
    expect(migratedSchema.invite.redeemComplete).toEqual(true)
    expect(migratedSchema.identity.startedVerification).toEqual(true)
    expect(migratedSchema.identity.askedContactsPermission).toEqual(true)
    expect(migratedSchema.identity.isLoadingImportContacts).toEqual(false)
  })
})
