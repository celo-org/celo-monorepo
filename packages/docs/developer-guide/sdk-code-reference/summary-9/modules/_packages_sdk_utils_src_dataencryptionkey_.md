# packages/sdk/utils/src/dataEncryptionKey

## Index

### Functions

* [compressedPubKey](_packages_sdk_utils_src_dataencryptionkey_.md#compressedpubkey)
* [decompressPublicKey](_packages_sdk_utils_src_dataencryptionkey_.md#decompresspublickey)
* [deriveDek](_packages_sdk_utils_src_dataencryptionkey_.md#derivedek)

### Object literals

* [DataEncryptionKeyUtils](_packages_sdk_utils_src_dataencryptionkey_.md#const-dataencryptionkeyutils)

## Functions

### compressedPubKey

▸ **compressedPubKey**\(`privateKey`: Buffer\): _string_

_Defined in_ [_packages/sdk/utils/src/dataEncryptionKey.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L13)

Turns a private key to a compressed public key \(hex string with hex leader\).

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `privateKey` | Buffer | Private key. |

**Returns:** _string_

Corresponding compessed public key in hex encoding with '0x' leader.

### decompressPublicKey

▸ **decompressPublicKey**\(`publicKey`: Buffer\): _Buffer_

_Defined in_ [_packages/sdk/utils/src/dataEncryptionKey.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L25)

Decompresses a public key and strips out the '0x04' leading constant. This makes any public key suitable to be used with this ECIES implementation.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `publicKey` | Buffer | Public key in standard form \(with 0x02, 0x03, or 0x04 prefix\) |

**Returns:** _Buffer_

Decompresssed public key without prefix.

### deriveDek

▸ **deriveDek**\(`mnemonic`: string, `bip39ToUse?`: [Bip39](_packages_sdk_utils_src_account_.md#bip39)\): _Promise‹object›_

_Defined in_ [_packages/sdk/utils/src/dataEncryptionKey.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L35)

Derives a data encryption key from the mnemonic

**Parameters:**

| Name | Type |
| :--- | :--- |
| `mnemonic` | string |
| `bip39ToUse?` | [Bip39](_packages_sdk_utils_src_account_.md#bip39) |

**Returns:** _Promise‹object›_

Comment Encryption Private key.

## Object literals

### `Const` DataEncryptionKeyUtils

### ▪ **DataEncryptionKeyUtils**: _object_

_Defined in_ [_packages/sdk/utils/src/dataEncryptionKey.ts:49_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L49)

### compressedPubKey

• **compressedPubKey**: [_compressedPubKey_](_packages_sdk_utils_src_dataencryptionkey_.md#compressedpubkey)

_Defined in_ [_packages/sdk/utils/src/dataEncryptionKey.ts:50_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L50)

### decompressPublicKey

• **decompressPublicKey**: [_decompressPublicKey_](_packages_sdk_utils_src_dataencryptionkey_.md#decompresspublickey)

_Defined in_ [_packages/sdk/utils/src/dataEncryptionKey.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L51)

### deriveDek

• **deriveDek**: [_deriveDek_](_packages_sdk_utils_src_dataencryptionkey_.md#derivedek)

_Defined in_ [_packages/sdk/utils/src/dataEncryptionKey.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dataEncryptionKey.ts#L52)

