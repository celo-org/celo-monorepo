import { EventLog } from '@celo/communication/types/commons'
import { AbiInput as Web3AbiInput, AbiItem as Web3AbiItem } from 'web3-utils'

export interface JsonRpcPayload extends WebCoreHelper.JsonRpcPayload {}

export type ABIType = 'uint256' | 'boolean' | 'string' | 'bytes' | string // TODO complete list

export interface DecodedParamsArray {
  [index: number]: any
  __length__: number
}
export interface DecodedParamsObject extends DecodedParamsArray {
  [key: string]: any
}

export interface AbiItem extends Web3AbiItem {}
export interface AbiInput extends Web3AbiInput {}

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
