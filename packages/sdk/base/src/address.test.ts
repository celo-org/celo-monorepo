import { getAddressChunks } from './address'

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
