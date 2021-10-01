import { trimLeading0x } from '@celo/base/lib/address'
import { BigNumber } from 'bignumber.js'
import { keccak } from 'ethereumjs-util'
import coder from 'web3-eth-abi'

export interface EIP712Parameter {
  name: string
  type: string
}

export interface EIP712Types {
  [key: string]: EIP712Parameter[]
}

export type EIP712ObjectValue =
  | string
  | number
  | BigNumber
  | boolean
  | EIP712Object
  | EIP712ObjectValue[]

export interface EIP712Object {
  [key: string]: EIP712ObjectValue
}

export interface EIP712TypedData {
  types: EIP712Types & { EIP712Domain: EIP712Parameter[] }
  domain: EIP712Object
  message: EIP712Object
  primaryType: string
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

export const EIP712_DYNAMIC_TYPES = ['bytes', 'string']

export const EIP712_BUILTIN_TYPES = EIP712_ATOMIC_TYPES.concat(EIP712_DYNAMIC_TYPES)

// Regular expression used to identify and parse EIP-712 array type strings.
const EIP712_ARRAY_REGEXP = /^(?<memberType>[\w<>\[\]_\-]+)(\[(?<fixedLength>\d+)?\])$/

/**
 * Utility type representing an optional value in a EIP-712 compatible manner, as long as the
 * concrete type T is a subtype of EIP712ObjectValue.
 */
export type Optional<T extends EIP712ObjectValue> = {
  defined: boolean
  value: T
}

// Compile-time check that Domain can be cast to type EIP712Object
// DO NOT MERGE: Move this.
declare let TEST_OPTIONAL_IS_EIP712: EIP712Object
TEST_OPTIONAL_IS_EIP712 = ({} as unknown) as Optional<EIP712ObjectValue>

/**
 * Generates the EIP712 Typed Data hash for signing
 * @param   typedData An object that conforms to the EIP712TypedData interface
 * @return  A Buffer containing the hash of the typed data.
 */
export function generateTypedDataHash(typedData: EIP712TypedData): Buffer {
  return keccak(
    Buffer.concat([
      Buffer.from('1901', 'hex'),
      structHash('EIP712Domain', typedData.domain, typedData.types),
      structHash(typedData.primaryType, typedData.message, typedData.types),
    ])
  ) as Buffer
}

/**
 * Given the primary type, and dictionary if types, this function assembles a sorted list
 * representing the transitive dependency closure of the primary type. (Inclusive of the primary
 * type itself.)
 */
function findDependencies(primaryType: string, types: EIP712Types, found: string[] = []): string[] {
  // If we have aready found the dependencies of this type, or it is a builtin, return early.
  if (found.includes(primaryType) || EIP712_BUILTIN_TYPES.includes(primaryType)) {
    return []
  }

  // If this is an array type, return the results for its member type.
  if (EIP712_ARRAY_REGEXP.test(primaryType)) {
    const match = EIP712_ARRAY_REGEXP.exec(primaryType)
    const memberType: string = match?.groups?.['memberType']!
    return findDependencies(memberType, types, found)
  }

  // If this is not a builtin and is not defined, we cannot correctly construct a type encoding.
  if (types[primaryType] === undefined) {
    throw new Error(`Unrecognized type ${primaryType} is not included in the EIP-712 type list`)
  }

  // Execute a depth-first search to populate the (inclusive) dependencies list.
  // By the first invarient of this function, the resulting list should not contain duplicates.
  const dependencies = [primaryType]
  for (const field of types[primaryType]) {
    dependencies.push(...findDependencies(field.type, types, found.concat(dependencies)))
  }
  return dependencies
}

/**
 * Creates a string encoding of the primary type, including all dependencies.
 * E.g. "Transaction(Person from,Person to,Asset tx)Asset(address token,uint256 amount)Person(address wallet,string name)"
 */
export function encodeType(primaryType: string, types: EIP712Types): string {
  let deps = findDependencies(primaryType, types)
  deps = deps.filter((d) => d !== primaryType)
  deps = [primaryType].concat(deps.sort())
  let result = ''
  for (const dep of deps) {
    result += `${dep}(${types[dep].map(({ name, type }) => `${type} ${name}`).join(',')})`
  }
  return result
}

export function typeHash(primaryType: string, types: EIP712Types): Buffer {
  return keccak(encodeType(primaryType, types)) as Buffer
}

/** Encodes a single EIP-712 value to a 32-byte buffer */
function encodeValue(valueType: string, value: EIP712ObjectValue, types: EIP712Types): Buffer {
  // Encode the atomic types as their corresponding soldity ABI type.
  if (EIP712_ATOMIC_TYPES.includes(valueType)) {
    // @ts-ignore TypeScript does not believe encodeParameter exists.
    const hexEncoded = coder.encodeParameter(valueType, normalizeValue(valueType, value))
    return Buffer.from(trimLeading0x(hexEncoded), 'hex')
  }

  // Encode `string` and `bytes` types as their keccak hash.
  if (valueType === 'string') {
    // Converting to Buffer before passing to `keccak` prevents an issue where the string is
    // interpretted as a hex-encoded string when is starts with 0x.
    // https://github.com/ethereumjs/ethereumjs-util/blob/7e3be1d97b4e11fbc4924836b8c444e644f643ac/index.js#L155-L183
    return keccak(Buffer.from(value as string, 'utf8')) as Buffer
  }
  if (valueType === 'bytes') {
    // Allow the user to use either utf8 (plain string) or hex encoding for their bytes.
    // Note: keccak throws if the value cannot be converted into a Buffer,
    return keccak(value as string) as Buffer
  }

  // Encode structs as its hashStruct (e.g. keccak(typeHash || encodeData(struct)) ).
  if (types[valueType] !== undefined) {
    // tslint:disable-next-line:no-unnecessary-type-assertion.
    return structHash(valueType, value as EIP712Object, types)
  }

  // Encode arrays as the hash of the concatenated encoding of the underlying types.
  if (EIP712_ARRAY_REGEXP.test(valueType)) {
    // Note: If a fixed length is provided in the type, it is not checked.
    const match = EIP712_ARRAY_REGEXP.exec(valueType)
    const memberType: string = match?.groups?.['memberType']!
    return keccak(
      Buffer.concat(
        (value as EIP712ObjectValue[]).map((member) => encodeValue(memberType, member, types))
      )
    ) as Buffer
  }

  throw new Error(`Unrecognized or unsupported type in EIP-712 encoding: ${valueType}`)
}

function normalizeValue(type: string, value: EIP712ObjectValue): EIP712ObjectValue {
  const normalizedValue =
    /u?int\d*/.test(type) && BigNumber.isBigNumber(value) ? value.toString() : value
  return normalizedValue
}

/**
 * Constructs the struct encoding of the data as the primary type.
 */
export function encodeData(primaryType: string, data: EIP712Object, types: EIP712Types): Buffer {
  const fields = types[primaryType]
  if (fields === undefined) {
    throw new Error(`Unrecognized primary type in EIP-712 encoding: ${primaryType}`)
  }

  return Buffer.concat(fields.map((field) => encodeValue(field.type, data[field.name], types)))
}

export function structHash(primaryType: string, data: EIP712Object, types: EIP712Types): Buffer {
  return keccak(
    Buffer.concat([typeHash(primaryType, types), encodeData(primaryType, data, types)])
  ) as Buffer
}
