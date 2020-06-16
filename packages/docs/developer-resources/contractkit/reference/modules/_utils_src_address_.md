# External module: "utils/src/address"

## Index

### References

* [isValidChecksumAddress](_utils_src_address_.md#isvalidchecksumaddress)
* [toChecksumAddress](_utils_src_address_.md#tochecksumaddress)

### Type aliases

* [Address](_utils_src_address_.md#address)

### Variables

* [NULL_ADDRESS](_utils_src_address_.md#const-null_address)

### Functions

* [bufferToHex](_utils_src_address_.md#const-buffertohex)
* [ensureLeading0x](_utils_src_address_.md#const-ensureleading0x)
* [eqAddress](_utils_src_address_.md#const-eqaddress)
* [findAddressIndex](_utils_src_address_.md#const-findaddressindex)
* [getAddressChunks](_utils_src_address_.md#const-getaddresschunks)
* [hexToBuffer](_utils_src_address_.md#const-hextobuffer)
* [isHexString](_utils_src_address_.md#const-ishexstring)
* [isValidAddress](_utils_src_address_.md#const-isvalidaddress)
* [isValidPrivateKey](_utils_src_address_.md#const-isvalidprivatekey)
* [mapAddressListDataOnto](_utils_src_address_.md#mapaddresslistdataonto)
* [mapAddressListOnto](_utils_src_address_.md#const-mapaddresslistonto)
* [normalizeAddress](_utils_src_address_.md#const-normalizeaddress)
* [normalizeAddressWith0x](_utils_src_address_.md#const-normalizeaddresswith0x)
* [privateKeyToAddress](_utils_src_address_.md#const-privatekeytoaddress)
* [privateKeyToPublicKey](_utils_src_address_.md#const-privatekeytopublickey)
* [publicKeyToAddress](_utils_src_address_.md#const-publickeytoaddress)
* [trimLeading0x](_utils_src_address_.md#const-trimleading0x)

## References

###  isValidChecksumAddress

• **isValidChecksumAddress**:

___

###  toChecksumAddress

• **toChecksumAddress**:

## Type aliases

###  Address

Ƭ **Address**: *string*

*Defined in [utils/src/address.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L12)*

## Variables

### `Const` NULL_ADDRESS

• **NULL_ADDRESS**: *"0x0000000000000000000000000000000000000000"* = "0x0000000000000000000000000000000000000000"

*Defined in [utils/src/address.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L51)*

## Functions

### `Const` bufferToHex

▸ **bufferToHex**(`buf`: Buffer): *string*

*Defined in [utils/src/address.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`buf` | Buffer |

**Returns:** *string*

___

### `Const` ensureLeading0x

▸ **ensureLeading0x**(`input`: string): *string*

*Defined in [utils/src/address.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

### `Const` eqAddress

▸ **eqAddress**(`a`: [Address](_utils_src_address_.md#address), `b`: [Address](_utils_src_address_.md#address)): *boolean*

*Defined in [utils/src/address.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | [Address](_utils_src_address_.md#address) |
`b` | [Address](_utils_src_address_.md#address) |

**Returns:** *boolean*

___

### `Const` findAddressIndex

▸ **findAddressIndex**(`address`: [Address](_utils_src_address_.md#address), `addresses`: [Address](_utils_src_address_.md#address)[]): *number*

*Defined in [utils/src/address.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](_utils_src_address_.md#address) |
`addresses` | [Address](_utils_src_address_.md#address)[] |

**Returns:** *number*

___

### `Const` getAddressChunks

▸ **getAddressChunks**(`input`: string): *string[]*

*Defined in [utils/src/address.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string[]*

___

### `Const` hexToBuffer

▸ **hexToBuffer**(`input`: string): *Buffer‹›*

*Defined in [utils/src/address.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *Buffer‹›*

___

### `Const` isHexString

▸ **isHexString**(`input`: string): *boolean*

*Defined in [utils/src/address.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *boolean*

___

### `Const` isValidAddress

▸ **isValidAddress**(`input`: string): *boolean*

*Defined in [utils/src/address.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *boolean*

___

### `Const` isValidPrivateKey

▸ **isValidPrivateKey**(`privateKey`: string): *boolean*

*Defined in [utils/src/address.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *boolean*

___

###  mapAddressListDataOnto

▸ **mapAddressListDataOnto**<**T**>(`data`: T[], `oldAddress`: [Address](_utils_src_address_.md#address)[], `newAddress`: [Address](_utils_src_address_.md#address)[], `initialValue`: T): *T[]*

*Defined in [utils/src/address.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L90)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`data` | T[] |
`oldAddress` | [Address](_utils_src_address_.md#address)[] |
`newAddress` | [Address](_utils_src_address_.md#address)[] |
`initialValue` | T |

**Returns:** *T[]*

___

### `Const` mapAddressListOnto

▸ **mapAddressListOnto**(`oldAddress`: [Address](_utils_src_address_.md#address)[], `newAddress`: [Address](_utils_src_address_.md#address)[]): *any[]*

*Defined in [utils/src/address.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`oldAddress` | [Address](_utils_src_address_.md#address)[] |
`newAddress` | [Address](_utils_src_address_.md#address)[] |

**Returns:** *any[]*

___

### `Const` normalizeAddress

▸ **normalizeAddress**(`a`: [Address](_utils_src_address_.md#address)): *string*

*Defined in [utils/src/address.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | [Address](_utils_src_address_.md#address) |

**Returns:** *string*

___

### `Const` normalizeAddressWith0x

▸ **normalizeAddressWith0x**(`a`: [Address](_utils_src_address_.md#address)): *string*

*Defined in [utils/src/address.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | [Address](_utils_src_address_.md#address) |

**Returns:** *string*

___

### `Const` privateKeyToAddress

▸ **privateKeyToAddress**(`privateKey`: string): *string*

*Defined in [utils/src/address.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *string*

___

### `Const` privateKeyToPublicKey

▸ **privateKeyToPublicKey**(`privateKey`: string): *string*

*Defined in [utils/src/address.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *string*

___

### `Const` publicKeyToAddress

▸ **publicKeyToAddress**(`publicKey`: string): *string*

*Defined in [utils/src/address.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *string*

___

### `Const` trimLeading0x

▸ **trimLeading0x**(`input`: string): *string*

*Defined in [utils/src/address.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*
