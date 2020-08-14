# External module: "base/src/address"

## Index

### Type aliases

* [Address](_base_src_address_.md#address)

### Variables

* [NULL_ADDRESS](_base_src_address_.md#const-null_address)

### Functions

* [bufferToHex](_base_src_address_.md#const-buffertohex)
* [ensureLeading0x](_base_src_address_.md#const-ensureleading0x)
* [eqAddress](_base_src_address_.md#const-eqaddress)
* [findAddressIndex](_base_src_address_.md#const-findaddressindex)
* [getAddressChunks](_base_src_address_.md#const-getaddresschunks)
* [hexToBuffer](_base_src_address_.md#const-hextobuffer)
* [isHexString](_base_src_address_.md#const-ishexstring)
* [mapAddressListDataOnto](_base_src_address_.md#mapaddresslistdataonto)
* [mapAddressListOnto](_base_src_address_.md#const-mapaddresslistonto)
* [normalizeAddress](_base_src_address_.md#const-normalizeaddress)
* [normalizeAddressWith0x](_base_src_address_.md#const-normalizeaddresswith0x)
* [trimLeading0x](_base_src_address_.md#const-trimleading0x)

## Type aliases

###  Address

Ƭ **Address**: *string*

*Defined in [base/src/address.ts:3](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L3)*

## Variables

### `Const` NULL_ADDRESS

• **NULL_ADDRESS**: *"0x0000000000000000000000000000000000000000"* = "0x0000000000000000000000000000000000000000"

*Defined in [base/src/address.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L26)*

## Functions

### `Const` bufferToHex

▸ **bufferToHex**(`buf`: Buffer): *string*

*Defined in [base/src/address.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`buf` | Buffer |

**Returns:** *string*

___

### `Const` ensureLeading0x

▸ **ensureLeading0x**(`input`: string): *string*

*Defined in [base/src/address.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

### `Const` eqAddress

▸ **eqAddress**(`a`: [Address](_base_src_address_.md#address), `b`: [Address](_base_src_address_.md#address)): *boolean*

*Defined in [base/src/address.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | [Address](_base_src_address_.md#address) |
`b` | [Address](_base_src_address_.md#address) |

**Returns:** *boolean*

___

### `Const` findAddressIndex

▸ **findAddressIndex**(`address`: [Address](_base_src_address_.md#address), `addresses`: [Address](_base_src_address_.md#address)[]): *number*

*Defined in [base/src/address.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](_base_src_address_.md#address) |
`addresses` | [Address](_base_src_address_.md#address)[] |

**Returns:** *number*

___

### `Const` getAddressChunks

▸ **getAddressChunks**(`input`: string): *string[]*

*Defined in [base/src/address.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string[]*

___

### `Const` hexToBuffer

▸ **hexToBuffer**(`input`: string): *Buffer‹›*

*Defined in [base/src/address.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *Buffer‹›*

___

### `Const` isHexString

▸ **isHexString**(`input`: string): *boolean*

*Defined in [base/src/address.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *boolean*

___

###  mapAddressListDataOnto

▸ **mapAddressListDataOnto**<**T**>(`data`: T[], `oldAddress`: [Address](_base_src_address_.md#address)[], `newAddress`: [Address](_base_src_address_.md#address)[], `initialValue`: T): *T[]*

*Defined in [base/src/address.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L65)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`data` | T[] |
`oldAddress` | [Address](_base_src_address_.md#address)[] |
`newAddress` | [Address](_base_src_address_.md#address)[] |
`initialValue` | T |

**Returns:** *T[]*

___

### `Const` mapAddressListOnto

▸ **mapAddressListOnto**(`oldAddress`: [Address](_base_src_address_.md#address)[], `newAddress`: [Address](_base_src_address_.md#address)[]): *any[]*

*Defined in [base/src/address.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`oldAddress` | [Address](_base_src_address_.md#address)[] |
`newAddress` | [Address](_base_src_address_.md#address)[] |

**Returns:** *any[]*

___

### `Const` normalizeAddress

▸ **normalizeAddress**(`a`: [Address](_base_src_address_.md#address)): *string*

*Defined in [base/src/address.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | [Address](_base_src_address_.md#address) |

**Returns:** *string*

___

### `Const` normalizeAddressWith0x

▸ **normalizeAddressWith0x**(`a`: [Address](_base_src_address_.md#address)): *string*

*Defined in [base/src/address.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | [Address](_base_src_address_.md#address) |

**Returns:** *string*

___

### `Const` trimLeading0x

▸ **trimLeading0x**(`input`: string): *string*

*Defined in [base/src/address.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/address.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*
