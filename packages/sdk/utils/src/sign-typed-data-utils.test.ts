import { EIP712Types, encodeType } from './sign-typed-data-utils'

describe('encodeType()', () => {
  const testTypes: { primaryType: string; types: EIP712Types; encoding: string }[] = [
    {
      primaryType: 'Mail',
      types: {
        Mail: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'contents', type: 'string' },
        ],
      },
      encoding: 'Mail(address from,address to,string contents)',
    },
    {
      primaryType: 'Transaction',
      types: {
        Transaction: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'tx', type: 'Asset' },
        ],
        Person: [
          { name: 'wallet', type: 'address' },
          { name: 'name', type: 'string' },
        ],
        Asset: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
      },
      encoding:
        'Transaction(Person from,Person to,Asset tx)Asset(address token,uint256 amount)Person(address wallet,string name)',
    },
    {
      primaryType: 'Nested',
      types: {
        Bird: [
          { name: 'species', type: 'string' },
          { name: 'color', type: 'Color' },
          { name: 'nest', type: 'Nested' },
        ],
        Color: [
          { name: 'red', type: 'uint8' },
          { name: 'green', type: 'uint8' },
          { name: 'blue', type: 'uint8' },
        ],
        Nested: [
          { name: 'nest', type: 'Nested' },
          { name: 'eggs', type: 'Egg[]' },
        ],
        Egg: [
          { name: 'bird', type: 'Bird' },
          { name: 'age', type: 'uint256' },
        ],
      },
      encoding:
        'Nested(Nested nest,Egg eggs)Bird(string species,Color color,Nested nest)Color(uint8 red,uint8 green,uint8 blue)Egg(Bird bird,uint256 age)',
    },
  ]

  for (const { primaryType, types, encoding } of testTypes) {
    it(`should encode ${primaryType} correctly`, () => {
      expect(encodeType(primaryType, types)).toEqual(encoding)
    })
  }
})
