import { NULL_ADDRESS } from '@celo/base/lib/address'
import { BigNumber } from 'bignumber.js'
import { keccak256 } from 'ethereum-cryptography/keccak'
import { utf8ToBytes } from 'ethereum-cryptography/utils'
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
          keccak256(utf8ToBytes('hello bob!')),
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
          keccak256(Buffer.from('0xdeadbeef', 'utf8')),
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
          keccak256(
            Buffer.concat([
              keccak256(utf8ToBytes('Person(address wallet,string name)')),
              Buffer.from(
                '000000000000000000000000000000000000000000000000000000000000a1ce',
                'hex'
              ),
              keccak256(utf8ToBytes('Alice')),
            ])
          ),
          keccak256(
            Buffer.concat([
              keccak256(utf8ToBytes('Person(address wallet,string name)')),
              Buffer.from(
                '0000000000000000000000000000000000000000000000000000000000000b0b',
                'hex'
              ),
              keccak256(utf8ToBytes('Bob')),
            ])
          ),
          keccak256(
            Buffer.concat([
              keccak256(utf8ToBytes('Asset(address token,uint256 amount)')),
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
          keccak256(
            Buffer.concat([
              keccak256(
                Buffer.concat([
                  keccak256(
                    Buffer.concat([
                      keccak256(utf8ToBytes('Tile(bool occupied,uint8 occupantId)')),
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
                  keccak256(
                    Buffer.concat([
                      keccak256(utf8ToBytes('Tile(bool occupied,uint8 occupantId)')),
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
              keccak256(
                Buffer.concat([
                  keccak256(
                    Buffer.concat([
                      keccak256(utf8ToBytes('Tile(bool occupied,uint8 occupantId)')),
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
                  keccak256(
                    Buffer.concat([
                      keccak256(utf8ToBytes('Tile(bool occupied,uint8 occupantId)')),
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
  {
    primaryType: 'AllAtomicTypes',
    types: {
      AllAtomicTypes: [
        { name: 'ui8', type: 'uint8' },
        { name: 'ui16', type: 'uint16' },
        { name: 'ui24', type: 'uint24' },
        { name: 'ui32', type: 'uint32' },
        { name: 'ui40', type: 'uint40' },
        { name: 'ui48', type: 'uint48' },
        { name: 'ui56', type: 'uint56' },
        { name: 'ui64', type: 'uint64' },
        { name: 'ui72', type: 'uint72' },
        { name: 'ui80', type: 'uint80' },
        { name: 'ui88', type: 'uint88' },
        { name: 'ui96', type: 'uint96' },
        { name: 'ui104', type: 'uint104' },
        { name: 'ui112', type: 'uint112' },
        { name: 'ui120', type: 'uint120' },
        { name: 'ui128', type: 'uint128' },
        { name: 'ui136', type: 'uint136' },
        { name: 'ui144', type: 'uint144' },
        { name: 'ui152', type: 'uint152' },
        { name: 'ui160', type: 'uint160' },
        { name: 'ui168', type: 'uint168' },
        { name: 'ui176', type: 'uint176' },
        { name: 'ui184', type: 'uint184' },
        { name: 'ui192', type: 'uint192' },
        { name: 'ui200', type: 'uint200' },
        { name: 'ui208', type: 'uint208' },
        { name: 'ui216', type: 'uint216' },
        { name: 'ui224', type: 'uint224' },
        { name: 'ui232', type: 'uint232' },
        { name: 'ui240', type: 'uint240' },
        { name: 'ui248', type: 'uint248' },
        { name: 'ui256', type: 'uint256' },
        { name: 'i8', type: 'int8' },
        { name: 'i16', type: 'int16' },
        { name: 'i24', type: 'int24' },
        { name: 'i32', type: 'int32' },
        { name: 'i40', type: 'int40' },
        { name: 'i48', type: 'int48' },
        { name: 'i56', type: 'int56' },
        { name: 'i64', type: 'int64' },
        { name: 'i72', type: 'int72' },
        { name: 'i80', type: 'int80' },
        { name: 'i88', type: 'int88' },
        { name: 'i96', type: 'int96' },
        { name: 'i104', type: 'int104' },
        { name: 'i112', type: 'int112' },
        { name: 'i120', type: 'int120' },
        { name: 'i128', type: 'int128' },
        { name: 'i136', type: 'int136' },
        { name: 'i144', type: 'int144' },
        { name: 'i152', type: 'int152' },
        { name: 'i160', type: 'int160' },
        { name: 'i168', type: 'int168' },
        { name: 'i176', type: 'int176' },
        { name: 'i184', type: 'int184' },
        { name: 'i192', type: 'int192' },
        { name: 'i200', type: 'int200' },
        { name: 'i208', type: 'int208' },
        { name: 'i216', type: 'int216' },
        { name: 'i224', type: 'int224' },
        { name: 'i232', type: 'int232' },
        { name: 'i240', type: 'int240' },
        { name: 'i248', type: 'int248' },
        { name: 'i256', type: 'int256' },
        { name: 'b1', type: 'bytes1' },
        { name: 'b2', type: 'bytes2' },
        { name: 'b3', type: 'bytes3' },
        { name: 'b4', type: 'bytes4' },
        { name: 'b5', type: 'bytes5' },
        { name: 'b6', type: 'bytes6' },
        { name: 'b7', type: 'bytes7' },
        { name: 'b8', type: 'bytes8' },
        { name: 'b9', type: 'bytes9' },
        { name: 'b10', type: 'bytes10' },
        { name: 'b11', type: 'bytes11' },
        { name: 'b12', type: 'bytes12' },
        { name: 'b13', type: 'bytes13' },
        { name: 'b14', type: 'bytes14' },
        { name: 'b15', type: 'bytes15' },
        { name: 'b16', type: 'bytes16' },
        { name: 'b17', type: 'bytes17' },
        { name: 'b18', type: 'bytes18' },
        { name: 'b19', type: 'bytes19' },
        { name: 'b20', type: 'bytes20' },
        { name: 'b21', type: 'bytes21' },
        { name: 'b22', type: 'bytes22' },
        { name: 'b23', type: 'bytes23' },
        { name: 'b24', type: 'bytes24' },
        { name: 'b25', type: 'bytes25' },
        { name: 'b26', type: 'bytes26' },
        { name: 'b27', type: 'bytes27' },
        { name: 'b28', type: 'bytes28' },
        { name: 'b29', type: 'bytes29' },
        { name: 'b30', type: 'bytes30' },
        { name: 'b31', type: 'bytes31' },
        { name: 'b32', type: 'bytes32' },
        { name: 'bl', type: 'bool' },
        { name: 'addr', type: 'address' },
      ],
    },
    typeEncoding:
      'AllAtomicTypes(uint8 ui8,uint16 ui16,uint24 ui24,uint32 ui32,uint40 ui40,uint48 ui48,uint56 ui56,uint64 ui64,uint72 ui72,uint80 ui80,uint88 ui88,uint96 ui96,uint104 ui104,uint112 ui112,uint120 ui120,uint128 ui128,uint136 ui136,uint144 ui144,uint152 ui152,uint160 ui160,uint168 ui168,uint176 ui176,uint184 ui184,uint192 ui192,uint200 ui200,uint208 ui208,uint216 ui216,uint224 ui224,uint232 ui232,uint240 ui240,uint248 ui248,uint256 ui256,int8 i8,int16 i16,int24 i24,int32 i32,int40 i40,int48 i48,int56 i56,int64 i64,int72 i72,int80 i80,int88 i88,int96 i96,int104 i104,int112 i112,int120 i120,int128 i128,int136 i136,int144 i144,int152 i152,int160 i160,int168 i168,int176 i176,int184 i184,int192 i192,int200 i200,int208 i208,int216 i216,int224 i224,int232 i232,int240 i240,int248 i248,int256 i256,bytes1 b1,bytes2 b2,bytes3 b3,bytes4 b4,bytes5 b5,bytes6 b6,bytes7 b7,bytes8 b8,bytes9 b9,bytes10 b10,bytes11 b11,bytes12 b12,bytes13 b13,bytes14 b14,bytes15 b15,bytes16 b16,bytes17 b17,bytes18 b18,bytes19 b19,bytes20 b20,bytes21 b21,bytes22 b22,bytes23 b23,bytes24 b24,bytes25 b25,bytes26 b26,bytes27 b27,bytes28 b28,bytes29 b29,bytes30 b30,bytes31 b31,bytes32 b32,bool bl,address addr)',
    examples: [],
  },
  {
    primaryType: 'SomeAtomicTypes',
    types: {
      SomeAtomicTypes: [
        { name: 'ui8', type: 'uint8' },
        { name: 'ui160', type: 'uint160' },
        { name: 'ui256', type: 'uint256' },
        { name: 'i8', type: 'int8' },
        { name: 'i160', type: 'int160' },
        { name: 'i256', type: 'int256' },
        { name: 'b1', type: 'bytes1' },
        { name: 'b16', type: 'bytes16' },
        { name: 'b32', type: 'bytes32' },
      ],
    },
    typeEncoding:
      'SomeAtomicTypes(uint8 ui8,uint160 ui160,uint256 ui256,int8 i8,int160 i160,int256 i256,bytes1 b1,bytes16 b16,bytes32 b32)',
    zero: {
      ui8: 0,
      ui160: 0,
      ui256: 0,
      i8: 0,
      i160: 0,
      i256: 0,
      b1: Buffer.from([]),
      b16: Buffer.from([]),
      b32: Buffer.from([]),
    },
    examples: [
      {
        data: {
          ui8: 250,
          ui160: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
          ui256: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          i8: -120,
          i160: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
          i256: '0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          b1: '0x01',
          b16: '0x0102030405060708090a0b0c0d0e0f10',
          b32: '0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
        },
        dataEncoding: Buffer.concat([
          Buffer.from('00000000000000000000000000000000000000000000000000000000000000fa', 'hex'),
          Buffer.from('0000000000000000000000001a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b', 'hex'),
          Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex'),
          Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff88', 'hex'),
          Buffer.from('0000000000000000000000001a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b', 'hex'),
          Buffer.from('7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex'),
          Buffer.from('0100000000000000000000000000000000000000000000000000000000000000', 'hex'),
          Buffer.from('0102030405060708090a0b0c0d0e0f1000000000000000000000000000000000', 'hex'),
          Buffer.from('0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20', 'hex'),
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
      expect(typeHash(primaryType, types)).toEqual(keccak256(utf8ToBytes(typeEncoding)))
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
          const expected = keccak256(Buffer.concat([typeHash(primaryType, types), dataEncoding]))
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
