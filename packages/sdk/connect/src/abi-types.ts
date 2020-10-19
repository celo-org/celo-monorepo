import { AbiInput, AbiItem } from 'web3-utils'
import { EventLog } from './types'

export type ABIType = 'uint256' | 'boolean' | 'string' | 'bytes' | string // TODO complete list

export interface DecodedParamsArray {
  [index: number]: any
  __length__: number
}
export interface DecodedParamsObject extends DecodedParamsArray {
  [key: string]: any
}

export { AbiItem }
export { AbiInput }

export interface ABIDefinition extends AbiItem {
  signature: string
}

export interface AbiCoder {
  decodeLog(inputs: AbiInput[], hexString: string, topics: string[]): EventLog

  encodeParameter(type: ABIType, parameter: any): string
  encodeParameters(types: ABIType[], paramaters: any[]): string

  encodeEventSignature(name: string | object): string
  encodeFunctionCall(jsonInterface: object, parameters: any[]): string
  encodeFunctionSignature(name: string | object): string

  decodeParameter(type: ABIType, hex: string): any

  decodeParameters(types: ABIType[], hex: string): DecodedParamsArray
  decodeParameters(types: AbiInput[], hex: string): DecodedParamsObject
}
