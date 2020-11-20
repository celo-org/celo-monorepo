import { extractSecurityCodeWithPrefix, getSecurityCodePrefix } from 'src/identity/securityCode'

describe(getSecurityCodePrefix, () => {
  it('should compute correct hash', () => {
    expect(getSecurityCodePrefix('0x000000000000000000000008')).toEqual('8')
    // 0xf7f551752A78Ce650385B58364225e5ec18D96cB -> 1415591498931780605110544902041322891412830525131
    expect(getSecurityCodePrefix('0xf7f551752A78Ce650385B58364225e5ec18D96cB')).toEqual('1')
  })
})

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
