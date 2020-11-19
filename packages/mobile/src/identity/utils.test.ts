import { extractShortSecurityCodeMessage, hashAddressToSingleDigit } from 'src/identity/utils'

describe(hashAddressToSingleDigit, () => {
  it('should compute correct hash', () => {
    expect(hashAddressToSingleDigit('0x000000000000000000000008')).toEqual(8)
    // 0xf7f551752A78Ce650385B58364225e5ec18D96cB -> 1415591498931780605110544902041322891412830525131
    expect(hashAddressToSingleDigit('0xf7f551752A78Ce650385B58364225e5ec18D96cB')).toEqual(1)
  })
})

describe(extractShortSecurityCodeMessage, () => {
  it('should extract with correct message', () => {
    expect(extractShortSecurityCodeMessage('<#> Celo security code: 51365977 5yaJvJcZt2P')).toEqual(
      '51365977'
    )
  })
  it('should NOT extract with incorrect message', () => {
    expect(extractShortSecurityCodeMessage('<#> Celo security code: 5136597 5yaJvJcZt2P')).toEqual(
      null
    )
  })
})
