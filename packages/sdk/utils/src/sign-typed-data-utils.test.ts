import { NULL_ADDRESS } from '@celo/base/lib/address'
import { BigNumber } from 'bignumber.js'
import { keccak } from 'ethereumjs-util'
import {
  EIP712Object,
  EIP712ObjectValue,
  EIP712Optional,
  EIP712Types,
  encodeData,
  encodeType,
  structHash,
  typeHash,
  zeroValue,
} from './sign-typed-data-utils'

// Compile-time check that Domain can be cast to type EIP712Object
export const TEST_OPTIONAL_IS_EIP712: EIP712Object =
  {} as unknown as EIP712Optional<EIP712ObjectValue>

interface EIP712TestCase {
  primaryType: string
  types: EIP712Types
  typeEncoding: string
  zero?: EIP712Object
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
    zero: {
      from: NULL_ADDRESS,
      to: NULL_ADDRESS,
      contents: '',
    },
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
          keccak('hello bob!'),
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
          keccak(Buffer.from('0xdeadbeef', 'utf8')),
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
    zero: {
      from: { wallet: NULL_ADDRESS, name: '' },
      to: { wallet: NULL_ADDRESS, name: '' },
      tx: { token: NULL_ADDRESS, amount: 0 },
    },
    examples: [
      {
        data: {
          from: { wallet: '0x000000000000000000000000000000000000a1ce', name: 'Alice' },
          to: { name: 'Bob', wallet: '0x0000000000000000000000000000000000000b0b' },
          tx: {
            token: '0x000000000000000000000000000000000000ce10',
            amount: new BigNumber('5e+18'),
          },
        },
        dataEncoding: Buffer.concat([
          keccak(
            Buffer.concat([
              keccak('Person(address wallet,string name)'),
              Buffer.from(
                '000000000000000000000000000000000000000000000000000000000000a1ce',
                'hex'
              ),
              keccak('Alice'),
            ])
          ),
          keccak(
            Buffer.concat([
              keccak('Person(address wallet,string name)'),
              Buffer.from(
                '0000000000000000000000000000000000000000000000000000000000000b0b',
                'hex'
              ),
              keccak('Bob'),
            ])
          ),
          keccak(
            Buffer.concat([
              keccak('Asset(address token,uint256 amount)'),
              Buffer.from(
                '000000000000000000000000000000000000000000000000000000000000ce10',
                'hex'
              ),
              Buffer.from(
                '0000000000000000000000000000000000000000000000004563918244F40000',
                'hex'
              ),
            ])
          ),
        ]),
      },
    ],
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
      // An orphaned type should have no effect on the encoding.
      Orphan: [],
    },
    typeEncoding:
      'Nested(Nested nest,Egg[][] eggs)Bird(string species,Color color,Nested nest)Color(uint8 red,uint8 green,uint8 blue)Egg(Bird bird,uint256 age)',
    // Although this recurive type definition can be encoded with EIP-712, no instance of it can.
    examples: [],
  },
  {
    primaryType: 'GameBoard',
    types: {
      GameBoard: [{ name: 'grid', type: 'Tile[][]' }],
      Tile: [
        { name: 'occupied', type: 'bool' },
        { name: 'occupantId', type: 'uint8' },
      ],
    },
    typeEncoding: 'GameBoard(Tile[][] grid)Tile(bool occupied,uint8 occupantId)',
    zero: {
      grid: [],
    },
    examples: [
      {
        data: {
          grid: [
            [
              { occupied: true, occupantId: 5 },
              { occupied: false, occupantId: 0 },
            ],
            [
              { occupied: true, occupantId: new BigNumber(160) },
              { occupied: true, occupantId: 161 },
            ],
          ],
        },
        dataEncoding: Buffer.concat([
          keccak(
            Buffer.concat([
              keccak(
                Buffer.concat([
                  keccak(
                    Buffer.concat([
                      keccak('Tile(bool occupied,uint8 occupantId)'),
                      Buffer.from(
                        '0000000000000000000000000000000000000000000000000000000000000001',
                        'hex'
                      ),
                      Buffer.from(
                        '0000000000000000000000000000000000000000000000000000000000000005',
                        'hex'
                      ),
                    ])
                  ),
                  keccak(
                    Buffer.concat([
                      keccak('Tile(bool occupied,uint8 occupantId)'),
                      Buffer.from(
                        '0000000000000000000000000000000000000000000000000000000000000000',
                        'hex'
                      ),
                      Buffer.from(
                        '0000000000000000000000000000000000000000000000000000000000000000',
                        'hex'
                      ),
                    ])
                  ),
                ])
              ),
              keccak(
                Buffer.concat([
                  keccak(
                    Buffer.concat([
                      keccak('Tile(bool occupied,uint8 occupantId)'),
                      Buffer.from(
                        '0000000000000000000000000000000000000000000000000000000000000001',
                        'hex'
                      ),
                      Buffer.from(
                        '00000000000000000000000000000000000000000000000000000000000000a0',
                        'hex'
                      ),
                    ])
                  ),
                  keccak(
                    Buffer.concat([
                      keccak('Tile(bool occupied,uint8 occupantId)'),
                      Buffer.from(
                        '0000000000000000000000000000000000000000000000000000000000000001',
                        'hex'
                      ),
                      Buffer.from(
                        '00000000000000000000000000000000000000000000000000000000000000a1',
                        'hex'
                      ),
                    ])
                  ),
                ])
              ),
            ])
          ),
        ]),
      },
    ],
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
      expect(typeHash(primaryType, types)).toEqual(keccak(typeEncoding))
    })
  }
})

describe('encodeData()', () => {
  for (const { primaryType, types, examples } of TEST_TYPES) {
    if (examples.length > 0) {
      it(`should encode data ${primaryType} correctly`, () => {
        for (const { data, dataEncoding } of examples) {
          expect(encodeData(primaryType, data, types)).toEqual(dataEncoding)
        }
      })
    }
  }
})

describe('structHash()', () => {
  for (const { primaryType, types, examples } of TEST_TYPES) {
    if (examples.length > 0) {
      it(`should hash data ${primaryType} correctly`, () => {
        for (const { data, dataEncoding } of examples) {
          const expected = keccak(Buffer.concat([typeHash(primaryType, types), dataEncoding]))
          expect(structHash(primaryType, data, types)).toEqual(expected)
        }
      })
    }
  }
})

describe('zeroValue()', () => {
  for (const { primaryType, types, zero } of TEST_TYPES) {
    if (zero !== undefined) {
      it(`should return zero value for ${primaryType} correctly`, () => {
        expect(zeroValue(primaryType, types)).toEqual(zero)
      })
    }
  }
})
