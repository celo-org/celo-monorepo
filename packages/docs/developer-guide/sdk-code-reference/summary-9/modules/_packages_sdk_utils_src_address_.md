# packages/sdk/utils/src/address

## Index

### References

* [Address](_packages_sdk_utils_src_address_.md#address)
* [NULL\_ADDRESS](_packages_sdk_utils_src_address_.md#null_address)
* [bufferToHex](_packages_sdk_utils_src_address_.md#buffertohex)
* [ensureLeading0x](_packages_sdk_utils_src_address_.md#ensureleading0x)
* [eqAddress](_packages_sdk_utils_src_address_.md#eqaddress)
* [findAddressIndex](_packages_sdk_utils_src_address_.md#findaddressindex)
* [getAddressChunks](_packages_sdk_utils_src_address_.md#getaddresschunks)
* [hexToBuffer](_packages_sdk_utils_src_address_.md#hextobuffer)
* [isHexString](_packages_sdk_utils_src_address_.md#ishexstring)
* [isValidChecksumAddress](_packages_sdk_utils_src_address_.md#isvalidchecksumaddress)
* [mapAddressListDataOnto](_packages_sdk_utils_src_address_.md#mapaddresslistdataonto)
* [mapAddressListOnto](_packages_sdk_utils_src_address_.md#mapaddresslistonto)
* [normalizeAddress](_packages_sdk_utils_src_address_.md#normalizeaddress)
* [normalizeAddressWith0x](_packages_sdk_utils_src_address_.md#normalizeaddresswith0x)
* [toChecksumAddress](_packages_sdk_utils_src_address_.md#tochecksumaddress)
* [trimLeading0x](_packages_sdk_utils_src_address_.md#trimleading0x)

### Functions

* [isValidAddress](_packages_sdk_utils_src_address_.md#const-isvalidaddress)
* [isValidPrivateKey](_packages_sdk_utils_src_address_.md#const-isvalidprivatekey)
* [privateKeyToAddress](_packages_sdk_utils_src_address_.md#const-privatekeytoaddress)
* [privateKeyToPublicKey](_packages_sdk_utils_src_address_.md#const-privatekeytopublickey)
* [publicKeyToAddress](_packages_sdk_utils_src_address_.md#const-publickeytoaddress)

## References

### Address

• **Address**:

### NULL\_ADDRESS

• **NULL\_ADDRESS**:

### bufferToHex

• **bufferToHex**:

### ensureLeading0x

• **ensureLeading0x**:

### eqAddress

• **eqAddress**:

### findAddressIndex

• **findAddressIndex**:

### getAddressChunks

• **getAddressChunks**:

### hexToBuffer

• **hexToBuffer**:

### isHexString

• **isHexString**:

### isValidChecksumAddress

• **isValidChecksumAddress**:

### mapAddressListDataOnto

• **mapAddressListDataOnto**:

### mapAddressListOnto

• **mapAddressListOnto**:

### normalizeAddress

• **normalizeAddress**:

### normalizeAddressWith0x

• **normalizeAddressWith0x**:

### toChecksumAddress

• **toChecksumAddress**:

### trimLeading0x

• **trimLeading0x**:

## Functions

### `Const` isValidAddress

▸ **isValidAddress**\(`input`: string\): _boolean_

_Defined in_ [_packages/sdk/utils/src/address.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/address.ts#L46)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | string |

**Returns:** _boolean_

### `Const` isValidPrivateKey

▸ **isValidPrivateKey**\(`privateKey`: string\): _boolean_

_Defined in_ [_packages/sdk/utils/src/address.ts:43_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/address.ts#L43)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |

**Returns:** _boolean_

### `Const` privateKeyToAddress

▸ **privateKeyToAddress**\(`privateKey`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/address.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/address.ts#L32)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |

**Returns:** _string_

### `Const` privateKeyToPublicKey

▸ **privateKeyToPublicKey**\(`privateKey`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/address.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/address.ts#L35)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |

**Returns:** _string_

### `Const` publicKeyToAddress

▸ **publicKeyToAddress**\(`publicKey`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/address.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/address.ts#L38)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `publicKey` | string |

**Returns:** _string_

