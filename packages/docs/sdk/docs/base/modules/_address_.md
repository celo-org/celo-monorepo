[@celo/base](../README.md) › ["address"](_address_.md)

# Module: "address"

## Index

### Type aliases

* [Address](_address_.md#address)

### Variables

* [NULL_ADDRESS](_address_.md#const-null_address)

### Functions

* [bufferToHex](_address_.md#const-buffertohex)
* [ensureLeading0x](_address_.md#const-ensureleading0x)
* [eqAddress](_address_.md#const-eqaddress)
* [findAddressIndex](_address_.md#const-findaddressindex)
* [getAddressChunks](_address_.md#const-getaddresschunks)
* [hexToBuffer](_address_.md#const-hextobuffer)
* [isHexString](_address_.md#const-ishexstring)
* [isNullAddress](_address_.md#const-isnulladdress)
* [mapAddressListDataOnto](_address_.md#mapaddresslistdataonto)
* [mapAddressListOnto](_address_.md#const-mapaddresslistonto)
* [normalizeAddress](_address_.md#const-normalizeaddress)
* [normalizeAddressWith0x](_address_.md#const-normalizeaddresswith0x)
* [trimLeading0x](_address_.md#const-trimleading0x)

## Type aliases

###  Address

Ƭ **Address**: *string*

*Defined in [packages/sdk/base/src/address.ts:3](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L3)*

## Variables

### `Const` NULL_ADDRESS

• **NULL_ADDRESS**: *"0x0000000000000000000000000000000000000000"* = "0x0000000000000000000000000000000000000000"

*Defined in [packages/sdk/base/src/address.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L28)*

## Functions

### `Const` bufferToHex

▸ **bufferToHex**(`buf`: Buffer): *string*

*Defined in [packages/sdk/base/src/address.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`buf` | Buffer |

**Returns:** *string*

___

### `Const` ensureLeading0x

▸ **ensureLeading0x**(`input`: string): *string*

*Defined in [packages/sdk/base/src/address.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

### `Const` eqAddress

▸ **eqAddress**(`a`: [Address](_address_.md#address), `b`: [Address](_address_.md#address)): *boolean*

*Defined in [packages/sdk/base/src/address.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | [Address](_address_.md#address) |
`b` | [Address](_address_.md#address) |

**Returns:** *boolean*

___

### `Const` findAddressIndex

▸ **findAddressIndex**(`address`: [Address](_address_.md#address), `addresses`: [Address](_address_.md#address)[]): *number*

*Defined in [packages/sdk/base/src/address.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](_address_.md#address) |
`addresses` | [Address](_address_.md#address)[] |

**Returns:** *number*

___

### `Const` getAddressChunks

▸ **getAddressChunks**(`input`: string): *string[]*

*Defined in [packages/sdk/base/src/address.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string[]*

___

### `Const` hexToBuffer

▸ **hexToBuffer**(`input`: string): *Buffer‹›*

*Defined in [packages/sdk/base/src/address.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *Buffer‹›*

___

### `Const` isHexString

▸ **isHexString**(`input`: string): *boolean*

*Defined in [packages/sdk/base/src/address.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *boolean*

___

### `Const` isNullAddress

▸ **isNullAddress**(`a`: [Address](_address_.md#address)): *boolean*

*Defined in [packages/sdk/base/src/address.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | [Address](_address_.md#address) |

**Returns:** *boolean*

___

###  mapAddressListDataOnto

▸ **mapAddressListDataOnto**<**T**>(`data`: T[], `oldAddress`: [Address](_address_.md#address)[], `newAddress`: [Address](_address_.md#address)[], `initialValue`: T): *T[]*

*Defined in [packages/sdk/base/src/address.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L67)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`data` | T[] |
`oldAddress` | [Address](_address_.md#address)[] |
`newAddress` | [Address](_address_.md#address)[] |
`initialValue` | T |

**Returns:** *T[]*

___

### `Const` mapAddressListOnto

▸ **mapAddressListOnto**(`oldAddress`: [Address](_address_.md#address)[], `newAddress`: [Address](_address_.md#address)[]): *any[]*

*Defined in [packages/sdk/base/src/address.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`oldAddress` | [Address](_address_.md#address)[] |
`newAddress` | [Address](_address_.md#address)[] |

**Returns:** *any[]*

___

### `Const` normalizeAddress

▸ **normalizeAddress**(`a`: [Address](_address_.md#address)): *string*

*Defined in [packages/sdk/base/src/address.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | [Address](_address_.md#address) |

**Returns:** *string*

___

### `Const` normalizeAddressWith0x

▸ **normalizeAddressWith0x**(`a`: [Address](_address_.md#address)): *string*

*Defined in [packages/sdk/base/src/address.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | [Address](_address_.md#address) |

**Returns:** *string*

___

### `Const` trimLeading0x

▸ **trimLeading0x**(`input`: string): *string*

*Defined in [packages/sdk/base/src/address.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*
