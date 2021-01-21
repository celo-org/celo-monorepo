# Module: "packages/sdk/utils/src/dataEncryptionKey"

## Index

### Functions

* [compressedPubKey](_packages_sdk_utils_src_dataencryptionkey_.md#compressedpubkey)
* [decompressPublicKey](_packages_sdk_utils_src_dataencryptionkey_.md#decompresspublickey)
* [deriveDek](_packages_sdk_utils_src_dataencryptionkey_.md#derivedek)

### Object literals

* [DataEncryptionKeyUtils](_packages_sdk_utils_src_dataencryptionkey_.md#const-dataencryptionkeyutils)

## Functions

###  compressedPubKey

▸ **compressedPubKey**(`privateKey`: Buffer): *string*

*Defined in [packages/sdk/utils/src/dataEncryptionKey.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L13)*

Turns a private key to a compressed public key (hex string with hex leader).

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`privateKey` | Buffer | Private key. |

**Returns:** *string*

Corresponding compessed public key in hex encoding with '0x' leader.

___

###  decompressPublicKey

▸ **decompressPublicKey**(`publicKey`: Buffer): *Buffer*

*Defined in [packages/sdk/utils/src/dataEncryptionKey.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L25)*

Decompresses a public key and strips out the '0x04' leading constant. This makes
any public key suitable to be used with this ECIES implementation.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`publicKey` | Buffer | Public key in standard form (with 0x02, 0x03, or 0x04 prefix) |

**Returns:** *Buffer*

Decompresssed public key without prefix.

___

###  deriveDek

▸ **deriveDek**(`mnemonic`: string, `bip39ToUse?`: [Bip39](_packages_sdk_utils_src_account_.md#bip39)): *Promise‹object›*

*Defined in [packages/sdk/utils/src/dataEncryptionKey.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L35)*

Derives a data encryption key from the mnemonic

**Parameters:**

Name | Type |
------ | ------ |
`mnemonic` | string |
`bip39ToUse?` | [Bip39](_packages_sdk_utils_src_account_.md#bip39) |

**Returns:** *Promise‹object›*

Comment Encryption Private key.

## Object literals

### `Const` DataEncryptionKeyUtils

### ▪ **DataEncryptionKeyUtils**: *object*

*Defined in [packages/sdk/utils/src/dataEncryptionKey.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L49)*

###  compressedPubKey

• **compressedPubKey**: *[compressedPubKey](_packages_sdk_utils_src_dataencryptionkey_.md#compressedpubkey)*

*Defined in [packages/sdk/utils/src/dataEncryptionKey.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L50)*

###  decompressPublicKey

• **decompressPublicKey**: *[decompressPublicKey](_packages_sdk_utils_src_dataencryptionkey_.md#decompresspublickey)*

*Defined in [packages/sdk/utils/src/dataEncryptionKey.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L51)*

###  deriveDek

• **deriveDek**: *[deriveDek](_packages_sdk_utils_src_dataencryptionkey_.md#derivedek)*

*Defined in [packages/sdk/utils/src/dataEncryptionKey.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L52)*
