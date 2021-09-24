import { trimLeading0x } from '@celo/base/lib/address'
import { BigNumber } from 'bignumber.js'
import { sha3 } from 'ethereumjs-util'
import coder from 'web3-eth-abi'

export interface EIP712Parameter {
  name: string
  type: string
}

export interface EIP712Types {
  [key: string]: EIP712Parameter[]
}

export type EIP712ObjectValue = string | number | boolean | EIP712Object | EIP712ObjectValue[]

export interface EIP712Object {
  [key: string]: EIP712ObjectValue
}

export interface EIP712TypedData {
  types: EIP712Types
  domain: EIP712Object
  message: EIP712Object
  primaryType: string
}

/**
 * Generates the EIP712 Typed Data hash for signing
 * @param   typedData An object that conforms to the EIP712TypedData interface
 * @return  A Buffer containing the hash of the typed data.
 */
export function generateTypedDataHash(typedData: EIP712TypedData): Buffer {
  return sha3(
    Buffer.concat([
      Buffer.from('1901', 'hex'),
      structHash('EIP712Domain', typedData.domain, typedData.types),
      structHash(typedData.primaryType, typedData.message, typedData.types),
    ])
  ) as Buffer
}

/** Array of all EIP-712 atomic type names. */
export const EIP712_ATOMIC_TYPES = [
  'bytes1',
  'bytes32',
  'uint8',
  'uint256',
  'int8',
  'int256',
  'bool',
  'address',
]

// Regular expression used to identify and parse EIP-712 array type strings.
const EIP712_ARRAY_REGEXP = /^(?<memberType>[\w<>\[\]_\-]+)(\[(?<fixedLength>\d+)?\])$/

/**
 * Given the primary type, and dictionary if types, this function assembles a sorted list
 * representing the transitive dependency closure of the primary type. (Inclusive of the primary
 * type itself.)
 */
function findDependencies(primaryType: string, types: EIP712Types, found: string[] = []): string[] {
  if (found.includes(primaryType) || types[primaryType] === undefined) {
    return found
  }
  found.push(primaryType)
  for (const field of types[primaryType]) {
    for (const dep of findDependencies(field.type, types, found)) {
      if (!found.includes(dep)) {
        found.push(dep)
      }
    }
  }
  return found
}

/**
 * Creates a string encoding of the primary type, including all dependencies.
 * E.g. "Mail(address from,address to,string contents)"
 */
function encodeType(primaryType: string, types: EIP712Types): string {
  let deps = findDependencies(primaryType, types)
  deps = deps.filter((d) => d !== primaryType)
  deps = [primaryType].concat(deps.sort())
  let result = ''
  for (const dep of deps) {
    result += `${dep}(${types[dep].map(({ name, type }) => `${type} ${name}`).join(',')})`
  }
  return result
}

function typeHash(primaryType: string, types: EIP712Types): Buffer {
  return sha3(encodeType(primaryType, types)) as Buffer
}

/**
 * Constructs the struct encoding of the data as the primary type.
 */
function encodeData(primaryType: string, data: EIP712Object, types: EIP712Types): Buffer {
  const fields = types[primaryType]
  if (fields === undefined) {
    throw new Error(`Unrecognized primary type in EIP-712 encoding: ${primaryType}`)
  }

  return Buffer.concat(fields.map((field) => encodeValue(field.type, data[field.name], types)))
}

/** Encodes a single EIP-712 value to a 32-byte buffer */
function encodeValue(valueType: string, value: EIP712ObjectValue, types: EIP712Types): Buffer {
  // Encode the atomic types as their corresponding soldity ABI type.
  if (EIP712_ATOMIC_TYPES.includes(valueType)) {
    // @ts-ignore TyppeScript does not believe encodeParameter exists.
    const hexEncoded = coder.encodeParameter(valueType, normalizeValue(valueType, value))
    return Buffer.from(trimLeading0x(hexEncoded), 'hex')
  }

  // Encode `string` and `bytes` types as their keccak hash.
  if (valueType === 'string' || valueType === 'bytes') {
    // Note: sha3 throws if the value cannot be converted inot a Buffer,
    const hashValue = sha3(value as string) as Buffer
    return hashValue
  }

  // Encode structs as its hashStruct (e.g. keccak(typeHash || encodeData(struct)) ).
  if (types[valueType] !== undefined) {
    // tslint:disable-next-line:no-unnecessary-type-assertion.
    return structHash(valueType, value as EIP712Object, types)
  }

  // Encode arrays as the concatenated encoding of the underlying types.
  if (EIP712_ARRAY_REGEXP.test(valueType)) {
    // Note: If a fixed length is provided in the type, it is not checked.
    const match = EIP712_ARRAY_REGEXP.exec(valueType)
    const memberType: string = match?.groups?.['memberType']!
    return Buffer.concat(
      (value as EIP712ObjectValue[]).map((member) => encodeValue(memberType, member, types))
    )
  }

  throw new Error(`Unrecognized or unsupported type in EIP-712 encoding: ${valueType}`)
}

function normalizeValue(type: string, value: any): EIP712ObjectValue {
  const normalizedValue =
    type === 'uint256' && BigNumber.isBigNumber(value) ? value.toString() : value
  return normalizedValue
}

export function structHash(primaryType: string, data: EIP712Object, types: EIP712Types): Buffer {
  return sha3(
    Buffer.concat([typeHash(primaryType, types), encodeData(primaryType, data, types)])
  ) as Buffer
}
