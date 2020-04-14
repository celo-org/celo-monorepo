# External module: "utils/src/address"

## Index

### References

* [isValidAddress](_utils_src_address_.md#isvalidaddress)
* [isValidChecksumAddress](_utils_src_address_.md#isvalidchecksumaddress)
* [toChecksumAddress](_utils_src_address_.md#tochecksumaddress)

### Type aliases

* [Address](_utils_src_address_.md#address)

### Variables

* [NULL_ADDRESS](_utils_src_address_.md#const-null_address)

### Functions

* [ensureLeading0x](_utils_src_address_.md#const-ensureleading0x)
* [eqAddress](_utils_src_address_.md#const-eqaddress)
* [findAddressIndex](_utils_src_address_.md#const-findaddressindex)
* [hexToBuffer](_utils_src_address_.md#const-hextobuffer)
* [isHexString](_utils_src_address_.md#const-ishexstring)
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

###  isValidAddress

• **isValidAddress**:

___

###  isValidChecksumAddress

• **isValidChecksumAddress**:

___

###  toChecksumAddress

• **toChecksumAddress**:

## Type aliases

###  Address

Ƭ **Address**: *string*

*Defined in [utils/src/address.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L11)*

## Variables

### `Const` NULL_ADDRESS

• **NULL_ADDRESS**: *"0x0000000000000000000000000000000000000000"* = "0x0000000000000000000000000000000000000000"

*Defined in [utils/src/address.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L41)*

## Functions

### `Const` ensureLeading0x

▸ **ensureLeading0x**(`input`: string): *string*

*Defined in [utils/src/address.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

### `Const` eqAddress

▸ **eqAddress**(`a`: [Address](_utils_src_address_.md#address), `b`: [Address](_utils_src_address_.md#address)): *boolean*

*Defined in [utils/src/address.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | [Address](_utils_src_address_.md#address) |
`b` | [Address](_utils_src_address_.md#address) |

**Returns:** *boolean*

___

### `Const` findAddressIndex

▸ **findAddressIndex**(`address`: [Address](_utils_src_address_.md#address), `addresses`: [Address](_utils_src_address_.md#address)[]): *number*

*Defined in [utils/src/address.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](_utils_src_address_.md#address) |
`addresses` | [Address](_utils_src_address_.md#address)[] |

**Returns:** *number*

___

### `Const` hexToBuffer

▸ **hexToBuffer**(`input`: string): *Buffer‹›*

*Defined in [utils/src/address.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *Buffer‹›*

___

### `Const` isHexString

▸ **isHexString**(`imput`: string): *boolean*

*Defined in [utils/src/address.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`imput` | string |

**Returns:** *boolean*

___

### `Const` isValidPrivateKey

▸ **isValidPrivateKey**(`privateKey`: string): *boolean*

*Defined in [utils/src/address.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *boolean*

___

###  mapAddressListDataOnto

▸ **mapAddressListDataOnto**<**T**>(`data`: T[], `oldAddress`: [Address](_utils_src_address_.md#address)[], `newAddress`: [Address](_utils_src_address_.md#address)[], `initialValue`: T): *T[]*

*Defined in [utils/src/address.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L80)*

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

*Defined in [utils/src/address.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`oldAddress` | [Address](_utils_src_address_.md#address)[] |
`newAddress` | [Address](_utils_src_address_.md#address)[] |

**Returns:** *any[]*

___

### `Const` normalizeAddress

▸ **normalizeAddress**(`a`: [Address](_utils_src_address_.md#address)): *string*

*Defined in [utils/src/address.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | [Address](_utils_src_address_.md#address) |

**Returns:** *string*

___

### `Const` normalizeAddressWith0x

▸ **normalizeAddressWith0x**(`a`: [Address](_utils_src_address_.md#address)): *string*

*Defined in [utils/src/address.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | [Address](_utils_src_address_.md#address) |

**Returns:** *string*

___

### `Const` privateKeyToAddress

▸ **privateKeyToAddress**(`privateKey`: string): *string*

*Defined in [utils/src/address.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *string*

___

### `Const` privateKeyToPublicKey

▸ **privateKeyToPublicKey**(`privateKey`: string): *string*

*Defined in [utils/src/address.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *string*

___

### `Const` publicKeyToAddress

▸ **publicKeyToAddress**(`publicKey`: string): *string*

*Defined in [utils/src/address.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *string*

___

### `Const` trimLeading0x

▸ **trimLeading0x**(`input`: string): *string*

*Defined in [utils/src/address.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*
