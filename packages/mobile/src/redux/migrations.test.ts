import { migrations } from 'src/redux/migrations'
import { getLatestSchema, v0Schema } from 'test/schemas'

describe('Redux persist migrations', () => {
  it('work for v-1 to v0', () => {
    const defaultSchema = v0Schema
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

  it('work for v0 to v1', () => {
    const defaultSchema = getLatestSchema()
    const v0Stub = {
      ...defaultSchema,
      app: {
        ...defaultSchema.app,
        language: 'es-AR',
      },
    }
    const migratedSchema = migrations[1](v0Stub)
    expect(migratedSchema.app.language).toEqual('es-419')
  })
})
