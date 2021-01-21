# proxy

## Index

### Variables

* [PROXY\_ABI](_proxy_.md#const-proxy_abi)
* [PROXY\_SET\_AND\_INITIALIZE\_IMPLEMENTATION\_SIGNATURE](_proxy_.md#const-proxy_set_and_initialize_implementation_signature)
* [PROXY\_SET\_IMPLEMENTATION\_SIGNATURE](_proxy_.md#const-proxy_set_implementation_signature)

### Functions

* [getInitializeAbiOfImplementation](_proxy_.md#const-getinitializeabiofimplementation)
* [setImplementationOnProxy](_proxy_.md#const-setimplementationonproxy)

### Object literals

* [GET\_IMPLEMENTATION\_ABI](_proxy_.md#const-get_implementation_abi)
* [SET\_AND\_INITIALIZE\_IMPLEMENTATION\_ABI](_proxy_.md#const-set_and_initialize_implementation_abi)
* [SET\_IMPLEMENTATION\_ABI](_proxy_.md#const-set_implementation_abi)

## Variables

### `Const` PROXY\_ABI

• **PROXY\_ABI**: _ABIDefinition\[\]_ = \[ GET\_IMPLEMENTATION\_ABI, SET\_IMPLEMENTATION\_ABI, SET\_AND\_INITIALIZE\_IMPLEMENTATION\_ABI, \]

_Defined in_ [_contractkit/src/proxy.ts:82_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L82)

### `Const` PROXY\_SET\_AND\_INITIALIZE\_IMPLEMENTATION\_SIGNATURE

• **PROXY\_SET\_AND\_INITIALIZE\_IMPLEMENTATION\_SIGNATURE**: _string_ = SET\_AND\_INITIALIZE\_IMPLEMENTATION\_ABI.signature

_Defined in_ [_contractkit/src/proxy.ts:89_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L89)

### `Const` PROXY\_SET\_IMPLEMENTATION\_SIGNATURE

• **PROXY\_SET\_IMPLEMENTATION\_SIGNATURE**: _string_ = SET\_IMPLEMENTATION\_ABI.signature

_Defined in_ [_contractkit/src/proxy.ts:88_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L88)

## Functions

### `Const` getInitializeAbiOfImplementation

▸ **getInitializeAbiOfImplementation**\(`proxyContractName`: keyof typeof initializeAbiMap\): _AbiItem_

_Defined in_ [_contractkit/src/proxy.ts:123_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L123)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proxyContractName` | keyof typeof initializeAbiMap |

**Returns:** _AbiItem_

### `Const` setImplementationOnProxy

▸ **setImplementationOnProxy**\(`address`: string, `web3`: Web3\): _any_

_Defined in_ [_contractkit/src/proxy.ts:133_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L133)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `web3` | Web3 |

**Returns:** _any_

## Object literals

### `Const` GET\_IMPLEMENTATION\_ABI

### ▪ **GET\_IMPLEMENTATION\_ABI**: _object_

_Defined in_ [_contractkit/src/proxy.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L30)

### constant

• **constant**: _true_ = true

_Defined in_ [_contractkit/src/proxy.ts:31_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L31)

### inputs

• **inputs**: _never\[\]_ = \[\]

_Defined in_ [_contractkit/src/proxy.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L32)

### name

• **name**: _string_ = "\_getImplementation"

_Defined in_ [_contractkit/src/proxy.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L33)

### outputs

• **outputs**: _object\[\]_ = \[ { name: 'implementation', type: 'address', }, \]

_Defined in_ [_contractkit/src/proxy.ts:34_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L34)

### payable

• **payable**: _false_ = false

_Defined in_ [_contractkit/src/proxy.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L40)

### signature

• **signature**: _string_ = "0x42404e07"

_Defined in_ [_contractkit/src/proxy.ts:43_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L43)

### stateMutability

• **stateMutability**: _"view"_ = "view"

_Defined in_ [_contractkit/src/proxy.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L41)

### type

• **type**: _"function"_ = "function"

_Defined in_ [_contractkit/src/proxy.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L42)

### `Const` SET\_AND\_INITIALIZE\_IMPLEMENTATION\_ABI

### ▪ **SET\_AND\_INITIALIZE\_IMPLEMENTATION\_ABI**: _object_

_Defined in_ [_contractkit/src/proxy.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L62)

### constant

• **constant**: _false_ = false

_Defined in_ [_contractkit/src/proxy.ts:63_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L63)

### inputs

• **inputs**: _object\[\]_ = \[ { name: 'implementation', type: 'address', }, { name: 'callbackData', type: 'bytes', }, \]

_Defined in_ [_contractkit/src/proxy.ts:64_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L64)

### name

• **name**: _string_ = "\_setAndInitializeImplementation"

_Defined in_ [_contractkit/src/proxy.ts:74_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L74)

### outputs

• **outputs**: _never\[\]_ = \[\]

_Defined in_ [_contractkit/src/proxy.ts:75_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L75)

### payable

• **payable**: _true_ = true

_Defined in_ [_contractkit/src/proxy.ts:76_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L76)

### signature

• **signature**: _string_ = "0x03386ba3"

_Defined in_ [_contractkit/src/proxy.ts:79_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L79)

### stateMutability

• **stateMutability**: _"payable"_ = "payable"

_Defined in_ [_contractkit/src/proxy.ts:77_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L77)

### type

• **type**: _"function"_ = "function"

_Defined in_ [_contractkit/src/proxy.ts:78_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L78)

### `Const` SET\_IMPLEMENTATION\_ABI

### ▪ **SET\_IMPLEMENTATION\_ABI**: _object_

_Defined in_ [_contractkit/src/proxy.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L46)

### constant

• **constant**: _false_ = false

_Defined in_ [_contractkit/src/proxy.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L47)

### inputs

• **inputs**: _object\[\]_ = \[ { name: 'implementation', type: 'address', }, \]

_Defined in_ [_contractkit/src/proxy.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L48)

### name

• **name**: _string_ = "\_setImplementation"

_Defined in_ [_contractkit/src/proxy.ts:54_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L54)

### outputs

• **outputs**: _never\[\]_ = \[\]

_Defined in_ [_contractkit/src/proxy.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L55)

### payable

• **payable**: _false_ = false

_Defined in_ [_contractkit/src/proxy.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L56)

### signature

• **signature**: _string_ = "0xbb913f41"

_Defined in_ [_contractkit/src/proxy.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L59)

### stateMutability

• **stateMutability**: _"nonpayable"_ = "nonpayable"

_Defined in_ [_contractkit/src/proxy.ts:57_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L57)

### type

• **type**: _"function"_ = "function"

_Defined in_ [_contractkit/src/proxy.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/proxy.ts#L58)

