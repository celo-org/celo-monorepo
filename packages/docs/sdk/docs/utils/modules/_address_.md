[@celo/utils](../README.md) › ["address"](_address_.md)

# Module: "address"

## Index

### References

* [Address](_address_.md#address)
* [NULL_ADDRESS](_address_.md#null_address)
* [bufferToHex](_address_.md#buffertohex)
* [ensureLeading0x](_address_.md#ensureleading0x)
* [eqAddress](_address_.md#eqaddress)
* [findAddressIndex](_address_.md#findaddressindex)
* [getAddressChunks](_address_.md#getaddresschunks)
* [hexToBuffer](_address_.md#hextobuffer)
* [isHexString](_address_.md#ishexstring)
* [isValidChecksumAddress](_address_.md#isvalidchecksumaddress)
* [mapAddressListDataOnto](_address_.md#mapaddresslistdataonto)
* [mapAddressListOnto](_address_.md#mapaddresslistonto)
* [normalizeAddress](_address_.md#normalizeaddress)
* [normalizeAddressWith0x](_address_.md#normalizeaddresswith0x)
* [toChecksumAddress](_address_.md#tochecksumaddress)
* [trimLeading0x](_address_.md#trimleading0x)

### Functions

* [isValidAddress](_address_.md#const-isvalidaddress)
* [isValidPrivateKey](_address_.md#const-isvalidprivatekey)
* [privateKeyToAddress](_address_.md#const-privatekeytoaddress)
* [privateKeyToPublicKey](_address_.md#const-privatekeytopublickey)
* [publicKeyToAddress](_address_.md#const-publickeytoaddress)

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

*Defined in [address.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/address.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *boolean*

___

### `Const` isValidPrivateKey

▸ **isValidPrivateKey**(`privateKey`: string): *boolean*

*Defined in [address.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/address.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *boolean*

___

### `Const` privateKeyToAddress

▸ **privateKeyToAddress**(`privateKey`: string): *string*

*Defined in [address.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/address.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *string*

___

### `Const` privateKeyToPublicKey

▸ **privateKeyToPublicKey**(`privateKey`: string): *string*

*Defined in [address.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/address.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *string*

___

### `Const` publicKeyToAddress

▸ **publicKeyToAddress**(`publicKey`: string): *string*

*Defined in [address.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/address.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *string*
