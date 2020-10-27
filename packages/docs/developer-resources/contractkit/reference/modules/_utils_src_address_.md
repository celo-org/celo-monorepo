# External module: "utils/src/address"

## Index

### References

* [Address](_utils_src_address_.md#address)
* [NULL_ADDRESS](_utils_src_address_.md#null_address)
* [bufferToHex](_utils_src_address_.md#buffertohex)
* [ensureLeading0x](_utils_src_address_.md#ensureleading0x)
* [eqAddress](_utils_src_address_.md#eqaddress)
* [findAddressIndex](_utils_src_address_.md#findaddressindex)
* [getAddressChunks](_utils_src_address_.md#getaddresschunks)
* [hexToBuffer](_utils_src_address_.md#hextobuffer)
* [isHexString](_utils_src_address_.md#ishexstring)
* [isValidChecksumAddress](_utils_src_address_.md#isvalidchecksumaddress)
* [mapAddressListDataOnto](_utils_src_address_.md#mapaddresslistdataonto)
* [mapAddressListOnto](_utils_src_address_.md#mapaddresslistonto)
* [normalizeAddress](_utils_src_address_.md#normalizeaddress)
* [normalizeAddressWith0x](_utils_src_address_.md#normalizeaddresswith0x)
* [toChecksumAddress](_utils_src_address_.md#tochecksumaddress)
* [trimLeading0x](_utils_src_address_.md#trimleading0x)

### Functions

* [isValidAddress](_utils_src_address_.md#const-isvalidaddress)
* [isValidPrivateKey](_utils_src_address_.md#const-isvalidprivatekey)
* [privateKeyToAddress](_utils_src_address_.md#const-privatekeytoaddress)
* [privateKeyToPublicKey](_utils_src_address_.md#const-privatekeytopublickey)
* [publicKeyToAddress](_utils_src_address_.md#const-publickeytoaddress)

## References

###  Address

• **Address**:

___

###  NULL_ADDRESS

• **NULL_ADDRESS**:

___

###  bufferToHex

• **bufferToHex**:

___

###  ensureLeading0x

• **ensureLeading0x**:

___

###  eqAddress

• **eqAddress**:

___

###  findAddressIndex

• **findAddressIndex**:

___

###  getAddressChunks

• **getAddressChunks**:

___

###  hexToBuffer

• **hexToBuffer**:

___

###  isHexString

• **isHexString**:

___

###  isValidChecksumAddress

• **isValidChecksumAddress**:

___

###  mapAddressListDataOnto

• **mapAddressListDataOnto**:

___

###  mapAddressListOnto

• **mapAddressListOnto**:

___

###  normalizeAddress

• **normalizeAddress**:

___

###  normalizeAddressWith0x

• **normalizeAddressWith0x**:

___

###  toChecksumAddress

• **toChecksumAddress**:

___

###  trimLeading0x

• **trimLeading0x**:

## Functions

### `Const` isValidAddress

▸ **isValidAddress**(`input`: string): *boolean*

*Defined in [packages/utils/src/address.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *boolean*

___

### `Const` isValidPrivateKey

▸ **isValidPrivateKey**(`privateKey`: string): *boolean*

*Defined in [packages/utils/src/address.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *boolean*

___

### `Const` privateKeyToAddress

▸ **privateKeyToAddress**(`privateKey`: string): *string*

*Defined in [packages/utils/src/address.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *string*

___

### `Const` privateKeyToPublicKey

▸ **privateKeyToPublicKey**(`privateKey`: string): *string*

*Defined in [packages/utils/src/address.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *string*

___

### `Const` publicKeyToAddress

▸ **publicKeyToAddress**(`publicKey`: string): *string*

*Defined in [packages/utils/src/address.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/address.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *string*
