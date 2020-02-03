import { BigNumber } from 'bignumber.js'
import * as ethUtil from 'ethereumjs-util'
import * as ethers from 'ethers'

export interface EIP712Parameter {
  name: string
  type: string
}

export interface EIP712Types {
  [key: string]: EIP712Parameter[]
}

export type EIP712ObjectValue = string | number | EIP712Object

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
  return ethUtil.sha3(
    Buffer.concat([
      Buffer.from('1901', 'hex'),
      _structHash('EIP712Domain', typedData.domain, typedData.types),
      _structHash(typedData.primaryType, typedData.message, typedData.types),
    ])
  ) as Buffer
}

function _findDependencies(
  primaryType: string,
  types: EIP712Types,
  found: string[] = []
): string[] {
  if (found.includes(primaryType) || types[primaryType] === undefined) {
    return found
  }
  found.push(primaryType)
  for (const field of types[primaryType]) {
    for (const dep of _findDependencies(field.type, types, found)) {
      if (!found.includes(dep)) {
        found.push(dep)
      }
    }
  }
  return found
}

function _encodeType(primaryType: string, types: EIP712Types): string {
  let deps = _findDependencies(primaryType, types)
  deps = deps.filter((d) => d !== primaryType)
  deps = [primaryType].concat(deps.sort())
  let result = ''
  for (const dep of deps) {
    result += `${dep}(${types[dep].map(({ name, type }) => `${type} ${name}`).join(',')})`
  }
  return result
}

function _encodeData(primaryType: string, data: EIP712Object, types: EIP712Types): string {
  const encodedTypes = ['bytes32']
  const encodedValues: Array<Buffer | EIP712ObjectValue> = [_typeHash(primaryType, types)]
  for (const field of types[primaryType]) {
    const value = data[field.name]
    if (field.type === 'string' || field.type === 'bytes') {
      const hashValue = ethUtil.sha3(value as string) as Buffer
      encodedTypes.push('bytes32')
      encodedValues.push(hashValue)
    } else if (types[field.type] !== undefined) {
      encodedTypes.push('bytes32')
      const hashValue = ethUtil.sha3(
        // tslint:disable-next-line:no-unnecessary-type-assertion
        _encodeData(field.type, value as EIP712Object, types)
      ) as Buffer
      encodedValues.push(hashValue)
    } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
      throw new Error('Arrays currently unimplemented in encodeData')
    } else {
      encodedTypes.push(field.type)
      const normalizedValue = _normalizeValue(field.type, value)
      encodedValues.push(normalizedValue)
    }
  }
  return ethers.utils.defaultAbiCoder.encode(encodedTypes, encodedValues)
}

function _normalizeValue(type: string, value: any): EIP712ObjectValue {
  const normalizedValue =
    type === 'uint256' && BigNumber.isBigNumber(value) ? value.toString() : value
  return normalizedValue
}

function _typeHash(primaryType: string, types: EIP712Types): Buffer {
  return ethUtil.sha3(_encodeType(primaryType, types)) as Buffer
}

function _structHash(primaryType: string, data: EIP712Object, types: EIP712Types): Buffer {
  return ethUtil.sha3(_encodeData(primaryType, data, types)) as Buffer
}
