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

*Defined in [packages/sdk/contractkit/src/proxy.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L83)*

___

### `Const` PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE

• **PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE**: *string* = SET_AND_INITIALIZE_IMPLEMENTATION_ABI.signature

*Defined in [packages/sdk/contractkit/src/proxy.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L90)*

___

### `Const` PROXY_SET_IMPLEMENTATION_SIGNATURE

• **PROXY_SET_IMPLEMENTATION_SIGNATURE**: *string* = SET_IMPLEMENTATION_ABI.signature

*Defined in [packages/sdk/contractkit/src/proxy.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L89)*

## Functions

### `Const` getInitializeAbiOfImplementation

▸ **getInitializeAbiOfImplementation**(`proxyContractName`: keyof typeof initializeAbiMap): *AbiItem*

*Defined in [packages/sdk/contractkit/src/proxy.ts:129](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L129)*

**Parameters:**

Name | Type |
------ | ------ |
`proxyContractName` | keyof typeof initializeAbiMap |

**Returns:** *AbiItem*

___

### `Const` setImplementationOnProxy

▸ **setImplementationOnProxy**(`address`: string, `web3`: Web3): *any*

*Defined in [packages/sdk/contractkit/src/proxy.ts:139](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L139)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`web3` | Web3 |

**Returns:** *any*

## Object literals

### `Const` GET_IMPLEMENTATION_ABI

### ▪ **GET_IMPLEMENTATION_ABI**: *object*

*Defined in [packages/sdk/contractkit/src/proxy.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L31)*

###  constant

• **constant**: *true* = true

*Defined in [packages/sdk/contractkit/src/proxy.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L32)*

###  inputs

• **inputs**: *never[]* = []

*Defined in [packages/sdk/contractkit/src/proxy.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L33)*

###  name

• **name**: *string* = "_getImplementation"

*Defined in [packages/sdk/contractkit/src/proxy.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L34)*

###  outputs

• **outputs**: *object[]* = [
    {
      name: 'implementation',
      type: 'address',
    },
  ]

*Defined in [packages/sdk/contractkit/src/proxy.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L35)*

###  payable

• **payable**: *false* = false

*Defined in [packages/sdk/contractkit/src/proxy.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L41)*

###  signature

• **signature**: *string* = "0x42404e07"

*Defined in [packages/sdk/contractkit/src/proxy.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L44)*

###  stateMutability

• **stateMutability**: *"view"* = "view"

*Defined in [packages/sdk/contractkit/src/proxy.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L42)*

###  type

• **type**: *"function"* = "function"

*Defined in [packages/sdk/contractkit/src/proxy.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L43)*

___

### `Const` SET_AND_INITIALIZE_IMPLEMENTATION_ABI

### ▪ **SET_AND_INITIALIZE_IMPLEMENTATION_ABI**: *object*

*Defined in [packages/sdk/contractkit/src/proxy.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L63)*

###  constant

• **constant**: *false* = false

*Defined in [packages/sdk/contractkit/src/proxy.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L64)*

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

*Defined in [packages/sdk/contractkit/src/proxy.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L65)*

###  name

• **name**: *string* = "_setAndInitializeImplementation"

*Defined in [packages/sdk/contractkit/src/proxy.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L75)*

###  outputs

• **outputs**: *never[]* = []

*Defined in [packages/sdk/contractkit/src/proxy.ts:76](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L76)*

###  payable

• **payable**: *true* = true

*Defined in [packages/sdk/contractkit/src/proxy.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L77)*

###  signature

• **signature**: *string* = "0x03386ba3"

*Defined in [packages/sdk/contractkit/src/proxy.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L80)*

###  stateMutability

• **stateMutability**: *"payable"* = "payable"

*Defined in [packages/sdk/contractkit/src/proxy.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L78)*

###  type

• **type**: *"function"* = "function"

*Defined in [packages/sdk/contractkit/src/proxy.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L79)*

___

### `Const` SET_IMPLEMENTATION_ABI

### ▪ **SET_IMPLEMENTATION_ABI**: *object*

*Defined in [packages/sdk/contractkit/src/proxy.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L47)*

###  constant

• **constant**: *false* = false

*Defined in [packages/sdk/contractkit/src/proxy.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L48)*

###  inputs

• **inputs**: *object[]* = [
    {
      name: 'implementation',
      type: 'address',
    },
  ]

*Defined in [packages/sdk/contractkit/src/proxy.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L49)*

###  name

• **name**: *string* = "_setImplementation"

*Defined in [packages/sdk/contractkit/src/proxy.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L55)*

###  outputs

• **outputs**: *never[]* = []

*Defined in [packages/sdk/contractkit/src/proxy.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L56)*

###  payable

• **payable**: *false* = false

*Defined in [packages/sdk/contractkit/src/proxy.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L57)*

###  signature

• **signature**: *string* = "0xbb913f41"

*Defined in [packages/sdk/contractkit/src/proxy.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L60)*

###  stateMutability

• **stateMutability**: *"nonpayable"* = "nonpayable"

*Defined in [packages/sdk/contractkit/src/proxy.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L58)*

###  type

• **type**: *"function"* = "function"

*Defined in [packages/sdk/contractkit/src/proxy.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L59)*
