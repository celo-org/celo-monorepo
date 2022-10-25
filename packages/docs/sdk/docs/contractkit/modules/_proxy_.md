[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["proxy"](_proxy_.md)

# Module: "proxy"

## Index

### Variables

* [PROXY_ABI](_proxy_.md#const-proxy_abi)
* [PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE](_proxy_.md#const-proxy_set_and_initialize_implementation_signature)
* [PROXY_SET_IMPLEMENTATION_SIGNATURE](_proxy_.md#const-proxy_set_implementation_signature)

### Functions

* [getInitializeAbiOfImplementation](_proxy_.md#const-getinitializeabiofimplementation)
* [setImplementationOnProxy](_proxy_.md#const-setimplementationonproxy)

### Object literals

* [GET_IMPLEMENTATION_ABI](_proxy_.md#const-get_implementation_abi)
* [SET_AND_INITIALIZE_IMPLEMENTATION_ABI](_proxy_.md#const-set_and_initialize_implementation_abi)
* [SET_IMPLEMENTATION_ABI](_proxy_.md#const-set_implementation_abi)

## Variables

### `Const` PROXY_ABI

• **PROXY_ABI**: *ABIDefinition[]* = [
  GET_IMPLEMENTATION_ABI,
  SET_IMPLEMENTATION_ABI,
  SET_AND_INITIALIZE_IMPLEMENTATION_ABI,
]

*Defined in [packages/sdk/contractkit/src/proxy.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L85)*

___

### `Const` PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE

• **PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE**: *string* = SET_AND_INITIALIZE_IMPLEMENTATION_ABI.signature

*Defined in [packages/sdk/contractkit/src/proxy.ts:92](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L92)*

___

### `Const` PROXY_SET_IMPLEMENTATION_SIGNATURE

• **PROXY_SET_IMPLEMENTATION_SIGNATURE**: *string* = SET_IMPLEMENTATION_ABI.signature

*Defined in [packages/sdk/contractkit/src/proxy.ts:91](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L91)*

## Functions

### `Const` getInitializeAbiOfImplementation

▸ **getInitializeAbiOfImplementation**(`proxyContractName`: keyof typeof initializeAbiMap): *AbiItem*

*Defined in [packages/sdk/contractkit/src/proxy.ts:133](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`proxyContractName` | keyof typeof initializeAbiMap |

**Returns:** *AbiItem*

___

### `Const` setImplementationOnProxy

▸ **setImplementationOnProxy**(`address`: string, `web3`: Web3): *any*

*Defined in [packages/sdk/contractkit/src/proxy.ts:143](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L143)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`web3` | Web3 |

**Returns:** *any*

## Object literals

### `Const` GET_IMPLEMENTATION_ABI

### ▪ **GET_IMPLEMENTATION_ABI**: *object*

*Defined in [packages/sdk/contractkit/src/proxy.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L33)*

###  constant

• **constant**: *true* = true

*Defined in [packages/sdk/contractkit/src/proxy.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L34)*

###  inputs

• **inputs**: *never[]* = []

*Defined in [packages/sdk/contractkit/src/proxy.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L35)*

###  name

• **name**: *string* = "_getImplementation"

*Defined in [packages/sdk/contractkit/src/proxy.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L36)*

###  outputs

• **outputs**: *object[]* = [
    {
      name: 'implementation',
      type: 'address',
    },
  ]

*Defined in [packages/sdk/contractkit/src/proxy.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L37)*

###  payable

• **payable**: *false* = false

*Defined in [packages/sdk/contractkit/src/proxy.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L43)*

###  signature

• **signature**: *string* = "0x42404e07"

*Defined in [packages/sdk/contractkit/src/proxy.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L46)*

###  stateMutability

• **stateMutability**: *"view"* = "view"

*Defined in [packages/sdk/contractkit/src/proxy.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L44)*

###  type

• **type**: *"function"* = "function"

*Defined in [packages/sdk/contractkit/src/proxy.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L45)*

___

### `Const` SET_AND_INITIALIZE_IMPLEMENTATION_ABI

### ▪ **SET_AND_INITIALIZE_IMPLEMENTATION_ABI**: *object*

*Defined in [packages/sdk/contractkit/src/proxy.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L65)*

###  constant

• **constant**: *false* = false

*Defined in [packages/sdk/contractkit/src/proxy.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L66)*

###  inputs

• **inputs**: *object[]* = [
    {
      name: 'implementation',
      type: 'address',
    },
    {
      name: 'callbackData',
      type: 'bytes',
    },
  ]

*Defined in [packages/sdk/contractkit/src/proxy.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L67)*

###  name

• **name**: *string* = "_setAndInitializeImplementation"

*Defined in [packages/sdk/contractkit/src/proxy.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L77)*

###  outputs

• **outputs**: *never[]* = []

*Defined in [packages/sdk/contractkit/src/proxy.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L78)*

###  payable

• **payable**: *true* = true

*Defined in [packages/sdk/contractkit/src/proxy.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L79)*

###  signature

• **signature**: *string* = "0x03386ba3"

*Defined in [packages/sdk/contractkit/src/proxy.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L82)*

###  stateMutability

• **stateMutability**: *"payable"* = "payable"

*Defined in [packages/sdk/contractkit/src/proxy.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L80)*

###  type

• **type**: *"function"* = "function"

*Defined in [packages/sdk/contractkit/src/proxy.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L81)*

___

### `Const` SET_IMPLEMENTATION_ABI

### ▪ **SET_IMPLEMENTATION_ABI**: *object*

*Defined in [packages/sdk/contractkit/src/proxy.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L49)*

###  constant

• **constant**: *false* = false

*Defined in [packages/sdk/contractkit/src/proxy.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L50)*

###  inputs

• **inputs**: *object[]* = [
    {
      name: 'implementation',
      type: 'address',
    },
  ]

*Defined in [packages/sdk/contractkit/src/proxy.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L51)*

###  name

• **name**: *string* = "_setImplementation"

*Defined in [packages/sdk/contractkit/src/proxy.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L57)*

###  outputs

• **outputs**: *never[]* = []

*Defined in [packages/sdk/contractkit/src/proxy.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L58)*

###  payable

• **payable**: *false* = false

*Defined in [packages/sdk/contractkit/src/proxy.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L59)*

###  signature

• **signature**: *string* = "0xbb913f41"

*Defined in [packages/sdk/contractkit/src/proxy.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L62)*

###  stateMutability

• **stateMutability**: *"nonpayable"* = "nonpayable"

*Defined in [packages/sdk/contractkit/src/proxy.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L60)*

###  type

• **type**: *"function"* = "function"

*Defined in [packages/sdk/contractkit/src/proxy.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L61)*
