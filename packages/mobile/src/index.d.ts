declare module '*.json' {
  const value: any
  export default value
}

declare module '*.png'
declare module '*.jpg'

declare module 'react-native-geth'
declare module 'react-native-tcp'
declare module 'react-native-confirm-device-credentials'
declare module 'react-native-send-intent'
declare module 'react-native-permissions'
declare module 'sleep-promise'
declare module 'react-native-progress/Bar'
declare module 'dot-prop-immutable'
declare module 'react-native-clock-sync'
declare module 'react-native-crypto'
declare module 'react-native-bip39'
declare module 'react-native-flag-secure-android'
declare module 'svgs'
declare module 'react-navigation-tabs'
declare module 'react-native-languages'
declare module 'react-native-swiper'
declare module 'react-native-version-check'
declare module 'react-native-randombytes'
declare module 'react-native-restart-android'
declare module 'react-native-mail'
declare module 'react-native-platform-touchable'
declare module 'numeral'
declare module 'redux-persist/lib/stateReconciler/autoMergeLevel2'
declare module 'react-native-shadow'
declare module 'react-native-svg'
declare module '@celo/react-native-sms-retriever'
declare module 'futoin-hkdf'
declare module 'react-native-share'
declare module 'react-native-qrcode-svg'
declare module 'eth-lib'
declare module 'web3-core-helpers'
declare module '@ungap/url-search-params'
declare module 'react-native-install-referrer'
declare module 'react-native-secure-key-store'
declare module 'qrcode'
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
