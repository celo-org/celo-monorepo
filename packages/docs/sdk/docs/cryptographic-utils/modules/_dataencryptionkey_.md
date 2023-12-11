[@celo/cryptographic-utils](../README.md) › [Globals](../globals.md) › ["dataEncryptionKey"](_dataencryptionkey_.md)

# Module: "dataEncryptionKey"

## Index

### Functions

* [compressedPubKey](_dataencryptionkey_.md#compressedpubkey)
* [decompressPublicKey](_dataencryptionkey_.md#decompresspublickey)
* [deriveDek](_dataencryptionkey_.md#derivedek)

### Object literals

* [DataEncryptionKeyUtils](_dataencryptionkey_.md#const-dataencryptionkeyutils)

## Functions

###  compressedPubKey

▸ **compressedPubKey**(`privateKey`: Buffer): *string*

*Defined in [dataEncryptionKey.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/dataEncryptionKey.ts#L10)*

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

*Defined in [dataEncryptionKey.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/dataEncryptionKey.ts#L27)*

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

▸ **deriveDek**(`mnemonic`: string, `bip39ToUse?`: [Bip39](_account_.md#bip39)): *[deriveDek](_dataencryptionkey_.md#derivedek)*

*Defined in [dataEncryptionKey.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/dataEncryptionKey.ts#L42)*

Derives a data encryption key from the mnemonic

**Parameters:**

Name | Type |
------ | ------ |
`mnemonic` | string |
`bip39ToUse?` | [Bip39](_account_.md#bip39) |

**Returns:** *[deriveDek](_dataencryptionkey_.md#derivedek)*

Comment Encryption Private key.

## Object literals

### `Const` DataEncryptionKeyUtils

### ▪ **DataEncryptionKeyUtils**: *object*

*Defined in [dataEncryptionKey.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/dataEncryptionKey.ts#L56)*

###  compressedPubKey

• **compressedPubKey**: *[compressedPubKey](_dataencryptionkey_.md#compressedpubkey)*

*Defined in [dataEncryptionKey.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/dataEncryptionKey.ts#L57)*

###  decompressPublicKey

• **decompressPublicKey**: *[decompressPublicKey](_dataencryptionkey_.md#decompresspublickey)*

*Defined in [dataEncryptionKey.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/dataEncryptionKey.ts#L58)*

###  deriveDek

• **deriveDek**: *[deriveDek](_dataencryptionkey_.md#derivedek)*

*Defined in [dataEncryptionKey.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/dataEncryptionKey.ts#L59)*
