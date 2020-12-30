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

*Defined in [contractkit/src/proxy.ts:82](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L82)*

___

### `Const` PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE

• **PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE**: *string* = SET_AND_INITIALIZE_IMPLEMENTATION_ABI.signature

*Defined in [contractkit/src/proxy.ts:89](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L89)*

___

### `Const` PROXY_SET_IMPLEMENTATION_SIGNATURE

• **PROXY_SET_IMPLEMENTATION_SIGNATURE**: *string* = SET_IMPLEMENTATION_ABI.signature

*Defined in [contractkit/src/proxy.ts:88](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L88)*

## Functions

### `Const` getInitializeAbiOfImplementation

▸ **getInitializeAbiOfImplementation**(`proxyContractName`: keyof typeof initializeAbiMap): *AbiItem*

*Defined in [contractkit/src/proxy.ts:123](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L123)*

**Parameters:**

Name | Type |
------ | ------ |
`proxyContractName` | keyof typeof initializeAbiMap |

**Returns:** *AbiItem*

___

### `Const` setImplementationOnProxy

▸ **setImplementationOnProxy**(`address`: string, `web3`: Web3): *any*

*Defined in [contractkit/src/proxy.ts:133](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`web3` | Web3 |

**Returns:** *any*

## Object literals

### `Const` GET_IMPLEMENTATION_ABI

### ▪ **GET_IMPLEMENTATION_ABI**: *object*

*Defined in [contractkit/src/proxy.ts:30](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L30)*

###  constant

• **constant**: *true* = true

*Defined in [contractkit/src/proxy.ts:31](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L31)*

###  inputs

• **inputs**: *never[]* = []

*Defined in [contractkit/src/proxy.ts:32](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L32)*

###  name

• **name**: *string* = "_getImplementation"

*Defined in [contractkit/src/proxy.ts:33](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L33)*

###  outputs

• **outputs**: *object[]* = [
    {
      name: 'implementation',
      type: 'address',
    },
  ]

*Defined in [contractkit/src/proxy.ts:34](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L34)*

###  payable

• **payable**: *false* = false

*Defined in [contractkit/src/proxy.ts:40](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L40)*

###  signature

• **signature**: *string* = "0x42404e07"

*Defined in [contractkit/src/proxy.ts:43](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L43)*

###  stateMutability

• **stateMutability**: *"view"* = "view"

*Defined in [contractkit/src/proxy.ts:41](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L41)*

###  type

• **type**: *"function"* = "function"

*Defined in [contractkit/src/proxy.ts:42](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L42)*

___

### `Const` SET_AND_INITIALIZE_IMPLEMENTATION_ABI

### ▪ **SET_AND_INITIALIZE_IMPLEMENTATION_ABI**: *object*

*Defined in [contractkit/src/proxy.ts:62](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L62)*

###  constant

• **constant**: *false* = false

*Defined in [contractkit/src/proxy.ts:63](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L63)*

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

*Defined in [contractkit/src/proxy.ts:64](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L64)*

###  name

• **name**: *string* = "_setAndInitializeImplementation"

*Defined in [contractkit/src/proxy.ts:74](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L74)*

###  outputs

• **outputs**: *never[]* = []

*Defined in [contractkit/src/proxy.ts:75](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L75)*

###  payable

• **payable**: *true* = true

*Defined in [contractkit/src/proxy.ts:76](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L76)*

###  signature

• **signature**: *string* = "0x03386ba3"

*Defined in [contractkit/src/proxy.ts:79](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L79)*

###  stateMutability

• **stateMutability**: *"payable"* = "payable"

*Defined in [contractkit/src/proxy.ts:77](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L77)*

###  type

• **type**: *"function"* = "function"

*Defined in [contractkit/src/proxy.ts:78](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L78)*

___

### `Const` SET_IMPLEMENTATION_ABI

### ▪ **SET_IMPLEMENTATION_ABI**: *object*

*Defined in [contractkit/src/proxy.ts:46](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L46)*

###  constant

• **constant**: *false* = false

*Defined in [contractkit/src/proxy.ts:47](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L47)*

###  inputs

• **inputs**: *object[]* = [
    {
      name: 'implementation',
      type: 'address',
    },
  ]

*Defined in [contractkit/src/proxy.ts:48](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L48)*

###  name

• **name**: *string* = "_setImplementation"

*Defined in [contractkit/src/proxy.ts:54](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L54)*

###  outputs

• **outputs**: *never[]* = []

*Defined in [contractkit/src/proxy.ts:55](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L55)*

###  payable

• **payable**: *false* = false

*Defined in [contractkit/src/proxy.ts:56](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L56)*

###  signature

• **signature**: *string* = "0xbb913f41"

*Defined in [contractkit/src/proxy.ts:59](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L59)*

###  stateMutability

• **stateMutability**: *"nonpayable"* = "nonpayable"

*Defined in [contractkit/src/proxy.ts:57](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L57)*

###  type

• **type**: *"function"* = "function"

*Defined in [contractkit/src/proxy.ts:58](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L58)*
