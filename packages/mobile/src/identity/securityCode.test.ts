import { extractSecurityCodeWithPrefix } from 'src/identity/securityCode'

describe(extractSecurityCodeWithPrefix, () => {
  it('should extract 8 digit code', () => {
    expect(extractSecurityCodeWithPrefix('<#> Celo security code: 51365977 5yaJvJcZt2P')).toEqual(
      '51365977'
    )
  })
  it('should NOT extract not 8 digit code', () => {
    expect(extractSecurityCodeWithPrefix('<#> Celo security code: 5136597 5yaJvJcZt2P')).toEqual(
      null
    )
  })
})
