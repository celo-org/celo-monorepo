import { getAddressChunks, isNullAddress } from './address'

describe(getAddressChunks, () => {
  test('splits the address into chunks of 4 chars', async () => {
    expect(getAddressChunks('0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10')).toEqual([
      'ce10',
      'ce10',
      'ce10',
      'ce10',
      'ce10',
      'ce10',
      'ce10',
      'ce10',
      'ce10',
      'ce10',
    ])
  })
})

describe(isNullAddress, () => {
  test('returns true for 0x0000000000000000000000000000000000000000', () => {
    expect(isNullAddress('0x0000000000000000000000000000000000000000')).toBe(true)
  })
  test('returns true for 0000000000000000000000000000000000000000', () => {
    expect(isNullAddress('0000000000000000000000000000000000000000')).toBe(true)
  })

  test('returns false for 0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10', () => {
    expect(isNullAddress('0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10')).toBe(false)
  })

  test('returns false for 0x0x0000000000000000000000000000000000000000', () => {
    expect(isNullAddress('0x0x0000000000000000000000000000000000000000')).toBe(false)
  })

  test('returns false for 0x000000000000000000000000000000000000ce10', () => {
    expect(isNullAddress('0x000000000000000000000000000000000000ce10')).toBe(false)
  })
})
