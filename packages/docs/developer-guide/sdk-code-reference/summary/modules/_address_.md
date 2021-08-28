# address

## Index

### Type aliases

* [Address](_address_.md#address)

### Variables

* [NULL\_ADDRESS](_address_.md#const-null_address)

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

### Address

Ƭ **Address**: _string_

_Defined in_ [_packages/sdk/base/src/address.ts:5_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L5)

## Variables

### `Const` NULL\_ADDRESS

• **NULL\_ADDRESS**: _"0x0000000000000000000000000000000000000000"_ = "0x0000000000000000000000000000000000000000"

_Defined in_ [_packages/sdk/base/src/address.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L30)

## Functions

### `Const` bufferToHex

▸ **bufferToHex**\(`buf`: Buffer\): _string_

_Defined in_ [_packages/sdk/base/src/address.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L28)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `buf` | Buffer |

**Returns:** _string_

### `Const` ensureLeading0x

▸ **ensureLeading0x**\(`input`: string\): _string_

_Defined in_ [_packages/sdk/base/src/address.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L17)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | string |

**Returns:** _string_

### `Const` eqAddress

▸ **eqAddress**\(`a`: [Address](_address_.md#address), `b`: [Address](_address_.md#address)\): _boolean_

_Defined in_ [_packages/sdk/base/src/address.ts:7_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L7)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `a` | [Address](_address_.md#address) |
| `b` | [Address](_address_.md#address) |

**Returns:** _boolean_

### `Const` findAddressIndex

▸ **findAddressIndex**\(`address`: [Address](_address_.md#address), `addresses`: [Address](_address_.md#address)\[\]\): _number_

_Defined in_ [_packages/sdk/base/src/address.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L32)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_address_.md#address) |
| `addresses` | [Address](_address_.md#address)\[\] |

**Returns:** _number_

### `Const` getAddressChunks

▸ **getAddressChunks**\(`input`: string\): _string\[\]_

_Defined in_ [_packages/sdk/base/src/address.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L21)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | string |

**Returns:** _string\[\]_

### `Const` hexToBuffer

▸ **hexToBuffer**\(`input`: string\): _Buffer‹›_

_Defined in_ [_packages/sdk/base/src/address.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | string |

**Returns:** _Buffer‹›_

### `Const` isHexString

▸ **isHexString**\(`input`: string\): _boolean_

_Defined in_ [_packages/sdk/base/src/address.ts:24_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L24)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | string |

**Returns:** _boolean_

### `Const` isNullAddress

▸ **isNullAddress**\(`a`: [Address](_address_.md#address)\): _boolean_

_Defined in_ [_packages/sdk/base/src/address.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L11)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `a` | [Address](_address_.md#address) |

**Returns:** _boolean_

### mapAddressListDataOnto

▸ **mapAddressListDataOnto**&lt;**T**&gt;\(`data`: T\[\], `oldAddress`: [Address](_address_.md#address)\[\], `newAddress`: [Address](_address_.md#address)\[\], `initialValue`: T\): _T\[\]_

_Defined in_ [_packages/sdk/base/src/address.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L69)

**Type parameters:**

▪ **T**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | T\[\] |
| `oldAddress` | [Address](_address_.md#address)\[\] |
| `newAddress` | [Address](_address_.md#address)\[\] |
| `initialValue` | T |

**Returns:** _T\[\]_

### `Const` mapAddressListOnto

▸ **mapAddressListOnto**\(`oldAddress`: [Address](_address_.md#address)\[\], `newAddress`: [Address](_address_.md#address)\[\]\): _any\[\]_

_Defined in_ [_packages/sdk/base/src/address.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L36)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `oldAddress` | [Address](_address_.md#address)\[\] |
| `newAddress` | [Address](_address_.md#address)\[\] |

**Returns:** _any\[\]_

### `Const` normalizeAddress

▸ **normalizeAddress**\(`a`: [Address](_address_.md#address)\): _string_

_Defined in_ [_packages/sdk/base/src/address.ts:9_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L9)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `a` | [Address](_address_.md#address) |

**Returns:** _string_

### `Const` normalizeAddressWith0x

▸ **normalizeAddressWith0x**\(`a`: [Address](_address_.md#address)\): _string_

_Defined in_ [_packages/sdk/base/src/address.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L13)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `a` | [Address](_address_.md#address) |

**Returns:** _string_

### `Const` trimLeading0x

▸ **trimLeading0x**\(`input`: string\): _string_

_Defined in_ [_packages/sdk/base/src/address.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/address.ts#L15)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | string |

**Returns:** _string_

