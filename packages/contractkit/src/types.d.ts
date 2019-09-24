declare module 'web3-eth-abi' {
  export interface ABIDefinition {
    constant?: boolean
    payable?: boolean
    stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable'
    anonymous?: boolean
    inputs?: ABIInputParameter[]
    name?: string
    outputs?: ABIOutputParameter[]
    type: 'function' | 'constructor' | 'event' | 'fallback'
    signature: string
  }

  export type ABIType = 'uint256' | 'boolean' | 'string' | 'bytes' | string // TODO complete list

  export interface ABIOutputParameter {
    name: string
    type: string
  }
  export interface ABIInputParameter extends ABIOutputParameter {
    indexed?: boolean
  }

  export interface DecodedParamsArray {
    [index: number]: any
    __length__: number
  }
  export interface DecodedParamsObject extends DecodedParamsArray {
    [key: string]: any
  }

  export interface EventLog {
    event: string
    address: string
    returnValues: any
    logIndex: number
    transactionIndex: number
    transactionHash: string
    blockHash: string
    blockNumber: number
    raw: { data: string; topics: string[] }
  }

  export interface AbiCoder {
    decodeLog(inputs: ABIInputParameter[], hexString: string, topics: string[]): EventLog

    encodeParameter(type: ABIType, parameter: any): string
    encodeParameters(types: ABIType[], paramaters: any[]): string

    encodeEventSignature(name: string | object): string
    encodeFunctionCall(jsonInterface: object, parameters: any[]): string
    encodeFunctionSignature(name: string | object): string

    decodeParameter(type: ABIType, hex: string): any

    decodeParameters(types: ABIType[], hex: string): DecodedParamsArray
    decodeParameters(types: ABIInputParameter[], hex: string): DecodedParamsObject
  }

  declare const coder: AbiCoder

  export default coder
}
