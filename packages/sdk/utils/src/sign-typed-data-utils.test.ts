import {
  EIP712Types,
  EIP712Object,
  encodeData,
  encodeType,
  typeHash,
} from './sign-typed-data-utils'
import { sha3 } from 'ethereumjs-util'

interface EIP712TestCase {
  primaryType: string
  types: EIP712Types
  typeEncoding: string
  examples: Array<{
    data: EIP712Object
    dataEncoding: Buffer
  }>
}

const TEST_TYPES: EIP712TestCase[] = [
  {
    primaryType: 'Mail',
    types: {
      Mail: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'contents', type: 'string' },
      ],
    },
    typeEncoding: 'Mail(address from,address to,string contents)',
    examples: [
      {
        data: {
          from: '0x000000000000000000000000000000000000a1ce',
          to: '0x0000000000000000000000000000000000000b0b',
          contents: 'hello bob!',
        },
        dataEncoding: Buffer.concat([
          Buffer.from('000000000000000000000000000000000000000000000000000000000000a1ce', 'hex'),
          Buffer.from('0000000000000000000000000000000000000000000000000000000000000b0b', 'hex'),
          sha3('hello bob!'),
        ]),
      },
      {
        data: {
          from: '0x000000000000000000000000000000000000a1ce',
          to: '0x0000000000000000000000000000000000000b0b',
          // Should be interpreted as a UTF-8 encoded string. Not hex encoded bytes.
          contents: '0xdeadbeef',
        },
        dataEncoding: Buffer.concat([
          Buffer.from('000000000000000000000000000000000000000000000000000000000000a1ce', 'hex'),
          Buffer.from('0000000000000000000000000000000000000000000000000000000000000b0b', 'hex'),
          sha3(Buffer.from('0xdeadbeef', 'utf8')),
        ]),
      },
    ],
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
    typeEncoding:
      'Transaction(Person from,Person to,Asset tx)Asset(address token,uint256 amount)Person(address wallet,string name)',
    // DO NOT MERGE: Add some examples.
    examples: [],
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
        { name: 'eggs', type: 'Egg[][]' },
      ],
      Egg: [
        { name: 'bird', type: 'Bird' },
        { name: 'age', type: 'uint256' },
      ],
    },
    typeEncoding:
      'Nested(Nested nest,Egg[][] eggs)Bird(string species,Color color,Nested nest)Color(uint8 red,uint8 green,uint8 blue)Egg(Bird bird,uint256 age)',
    // Although this recurive type definition can be encoded with EIP-712, no instance of it can.
    examples: [],
  },
]

describe('encodeType()', () => {
  for (const { primaryType, types, typeEncoding } of TEST_TYPES) {
    it(`should encode type ${primaryType} correctly`, () => {
      expect(encodeType(primaryType, types)).toEqual(typeEncoding)
    })
  }
})

describe('typeHash()', () => {
  for (const { primaryType, types, typeEncoding } of TEST_TYPES) {
    it(`should hash type ${primaryType} correctly`, () => {
      expect(typeHash(primaryType, types)).toEqual(sha3(typeEncoding))
    })
  }
})

describe('encodeData()', () => {
  for (const { primaryType, types, examples } of TEST_TYPES) {
    it(`should encode data ${primaryType} correctly`, () => {
      for (const { data, dataEncoding } of examples) {
        expect(encodeData(primaryType, data, types)).toEqual(dataEncoding)
      }
    })
  }
})
