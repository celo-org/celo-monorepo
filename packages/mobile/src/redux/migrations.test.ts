import { PincodeType } from 'src/account/reducer'
import { migrations } from 'src/redux/migrations'
import { v0Schema, v1Schema, v2Schema, v3Schema, v4Schema, vNeg1Schema } from 'test/schemas'

describe('Redux persist migrations', () => {
  it('work for v-1 to v0', () => {
    const vNeg1Stub = {
      ...vNeg1Schema,
      app: {
        ...vNeg1Schema.app,
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
    const v0Stub = {
      ...v0Schema,
      app: {
        ...v0Schema.app,
        language: 'es-AR',
      },
    }
    const migratedSchema = migrations[1](v0Stub)
    expect(migratedSchema.app.language).toEqual('es-419')
  })

  it('work for v1 to v2', () => {
    const v1Stub = {
      ...v1Schema,
      account: {
        ...v1Schema.app,
        pincodeSet: true,
      },
    }
    const migratedSchema = migrations[2](v1Stub)
    expect(migratedSchema.account.pincodeType).toEqual(PincodeType.PhoneAuth)
  })

  it('work for v2 to v3', () => {
    const v2Stub = {
      ...v2Schema,
      localCurrency: {
        ...v2Schema.localCurrency,
        symbol: 'ABC',
      },
    }
    const migratedSchema = migrations[3](v2Stub)
    expect(migratedSchema.localCurrency.symbol).toBeUndefined()
    expect(migratedSchema.localCurrency.fetchedCurrencyCode).toEqual('ABC')
  })

  it('work for v3 to v4', () => {
    const v3Stub = {
      ...v3Schema,
      identity: {
        ...v3Schema.identity,
        startedVerification: true,
      },
    }
    const migratedSchema = migrations[4](v3Stub)
    expect(migratedSchema.identity.startedVerification).toBeUndefined()
    expect(migratedSchema.identity.hasSeenVerificationNux).toBeTruthy()
  })

  it('work for v4 to v5', () => {
    const v4Stub = {
      ...v4Schema,
      localCurrency: {
        ...v4Schema.localCurrency,
        exchangeRate: 1.33,
      },
    }
    const migratedSchema = migrations[5](v4Stub)
    expect(migratedSchema.localCurrency.exchangeRate).toEqual('1.33')
  })
})
