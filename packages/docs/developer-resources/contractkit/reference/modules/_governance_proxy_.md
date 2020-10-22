# External module: "governance/proxy"

## Index

### Variables

* [PROXY_ABI](_governance_proxy_.md#const-proxy_abi)
* [PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE](_governance_proxy_.md#const-proxy_set_and_initialize_implementation_signature)
* [PROXY_SET_IMPLEMENTATION_SIGNATURE](_governance_proxy_.md#const-proxy_set_implementation_signature)

### Functions

* [getImplementationOfProxy](_governance_proxy_.md#const-getimplementationofproxy)
* [setImplementationOnProxy](_governance_proxy_.md#const-setimplementationonproxy)

### Object literals

* [GET_IMPLEMENTATION_ABI](_governance_proxy_.md#const-get_implementation_abi)
* [SET_AND_INITIALIZE_IMPLEMENTATION_ABI](_governance_proxy_.md#const-set_and_initialize_implementation_abi)
* [SET_IMPLEMENTATION_ABI](_governance_proxy_.md#const-set_implementation_abi)

## Variables

### `Const` PROXY_ABI

• **PROXY_ABI**: *ABIDefinition[]* = [
  GET_IMPLEMENTATION_ABI,
  SET_IMPLEMENTATION_ABI,
  SET_AND_INITIALIZE_IMPLEMENTATION_ABI,
]

*Defined in [packages/contractkit/src/governance/proxy.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L56)*

___

### `Const` PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE

• **PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE**: *string* = SET_AND_INITIALIZE_IMPLEMENTATION_ABI.signature

*Defined in [packages/contractkit/src/governance/proxy.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L63)*

___

### `Const` PROXY_SET_IMPLEMENTATION_SIGNATURE

• **PROXY_SET_IMPLEMENTATION_SIGNATURE**: *string* = SET_IMPLEMENTATION_ABI.signature

*Defined in [packages/contractkit/src/governance/proxy.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L62)*

## Functions

### `Const` getImplementationOfProxy

▸ **getImplementationOfProxy**(`web3`: Web3, `proxyContractAddress`: string): *Promise‹string›*

*Defined in [packages/contractkit/src/governance/proxy.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |
`proxyContractAddress` | string |

**Returns:** *Promise‹string›*

___

### `Const` setImplementationOnProxy

▸ **setImplementationOnProxy**(`address`: string): *any*

*Defined in [packages/contractkit/src/governance/proxy.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *any*

## Object literals

### `Const` GET_IMPLEMENTATION_ABI

### ▪ **GET_IMPLEMENTATION_ABI**: *object*

*Defined in [packages/contractkit/src/governance/proxy.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L4)*

###  constant

• **constant**: *true* = true

*Defined in [packages/contractkit/src/governance/proxy.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L5)*

###  inputs

• **inputs**: *never[]* = []

*Defined in [packages/contractkit/src/governance/proxy.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L6)*

###  name

• **name**: *string* = "_getImplementation"

*Defined in [packages/contractkit/src/governance/proxy.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L7)*

###  outputs

• **outputs**: *object[]* = [
    {
      name: 'implementation',
      type: 'address',
    },
  ]

*Defined in [packages/contractkit/src/governance/proxy.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L8)*

###  payable

• **payable**: *false* = false

*Defined in [packages/contractkit/src/governance/proxy.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L14)*

###  signature

• **signature**: *string* = "0x42404e07"

*Defined in [packages/contractkit/src/governance/proxy.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L17)*

###  stateMutability

• **stateMutability**: *"view"* = "view"

*Defined in [packages/contractkit/src/governance/proxy.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L15)*

###  type

• **type**: *"function"* = "function"

*Defined in [packages/contractkit/src/governance/proxy.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L16)*

___

### `Const` SET_AND_INITIALIZE_IMPLEMENTATION_ABI

### ▪ **SET_AND_INITIALIZE_IMPLEMENTATION_ABI**: *object*

*Defined in [packages/contractkit/src/governance/proxy.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L36)*

###  constant

• **constant**: *false* = false

*Defined in [packages/contractkit/src/governance/proxy.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L37)*

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

*Defined in [packages/contractkit/src/governance/proxy.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L38)*

###  name

• **name**: *string* = "_setAndInitializeImplementation"

*Defined in [packages/contractkit/src/governance/proxy.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L48)*

###  outputs

• **outputs**: *never[]* = []

*Defined in [packages/contractkit/src/governance/proxy.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L49)*

###  payable

• **payable**: *true* = true

*Defined in [packages/contractkit/src/governance/proxy.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L50)*

###  signature

• **signature**: *string* = "0x03386ba3"

*Defined in [packages/contractkit/src/governance/proxy.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L53)*

###  stateMutability

• **stateMutability**: *"payable"* = "payable"

*Defined in [packages/contractkit/src/governance/proxy.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L51)*

###  type

• **type**: *"function"* = "function"

*Defined in [packages/contractkit/src/governance/proxy.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L52)*

___

### `Const` SET_IMPLEMENTATION_ABI

### ▪ **SET_IMPLEMENTATION_ABI**: *object*

*Defined in [packages/contractkit/src/governance/proxy.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L20)*

###  constant

• **constant**: *false* = false

*Defined in [packages/contractkit/src/governance/proxy.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L21)*

###  inputs

• **inputs**: *object[]* = [
    {
      name: 'implementation',
      type: 'address',
    },
  ]

*Defined in [packages/contractkit/src/governance/proxy.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L22)*

###  name

• **name**: *string* = "_setImplementation"

*Defined in [packages/contractkit/src/governance/proxy.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L28)*

###  outputs

• **outputs**: *never[]* = []

*Defined in [packages/contractkit/src/governance/proxy.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L29)*

###  payable

• **payable**: *false* = false

*Defined in [packages/contractkit/src/governance/proxy.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L30)*

###  signature

• **signature**: *string* = "0xbb913f41"

*Defined in [packages/contractkit/src/governance/proxy.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L33)*

###  stateMutability

• **stateMutability**: *"nonpayable"* = "nonpayable"

*Defined in [packages/contractkit/src/governance/proxy.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L31)*

###  type

• **type**: *"function"* = "function"

*Defined in [packages/contractkit/src/governance/proxy.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L32)*
