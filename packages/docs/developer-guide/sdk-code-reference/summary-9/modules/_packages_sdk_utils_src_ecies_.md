# packages/sdk/utils/src/ecies

## Index

### Variables

* [IV\_LENGTH](_packages_sdk_utils_src_ecies_.md#const-iv_length)

### Functions

* [AES128Decrypt](_packages_sdk_utils_src_ecies_.md#aes128decrypt)
* [AES128DecryptAndHMAC](_packages_sdk_utils_src_ecies_.md#aes128decryptandhmac)
* [AES128Encrypt](_packages_sdk_utils_src_ecies_.md#aes128encrypt)
* [AES128EncryptAndHMAC](_packages_sdk_utils_src_ecies_.md#aes128encryptandhmac)
* [Decrypt](_packages_sdk_utils_src_ecies_.md#decrypt)
* [Encrypt](_packages_sdk_utils_src_ecies_.md#encrypt)

### Object literals

* [ECIES](_packages_sdk_utils_src_ecies_.md#const-ecies)

## Variables

### `Const` IV\_LENGTH

• **IV\_LENGTH**: _16_ = 16

_Defined in_ [_packages/sdk/utils/src/ecies.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L13)

## Functions

### AES128Decrypt

▸ **AES128Decrypt**\(`encryptionKey`: Buffer, `iv`: Buffer, `ciphertext`: Buffer\): _Buffer‹›_

_Defined in_ [_packages/sdk/utils/src/ecies.ts:100_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L100)

AES-128 CTR decrypt

**Parameters:**

| Name | Type |
| :--- | :--- |
| `encryptionKey` | Buffer |
| `iv` | Buffer |
| `ciphertext` | Buffer |

**Returns:** _Buffer‹›_

plaintext

### AES128DecryptAndHMAC

▸ **AES128DecryptAndHMAC**\(`encryptionKey`: Buffer, `macKey`: Buffer, `ciphertext`: Buffer\): _Buffer_

_Defined in_ [_packages/sdk/utils/src/ecies.ts:115_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L115)

AES-128 CTR decrypt with message authentication

**Parameters:**

| Name | Type |
| :--- | :--- |
| `encryptionKey` | Buffer |
| `macKey` | Buffer |
| `ciphertext` | Buffer |

**Returns:** _Buffer_

plaintext

### AES128Encrypt

▸ **AES128Encrypt**\(`encryptionKey`: Buffer, `iv`: Buffer, `plaintext`: Buffer\): _Buffer‹›_

_Defined in_ [_packages/sdk/utils/src/ecies.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L65)

AES-128 CTR encrypt

**Parameters:**

| Name | Type |
| :--- | :--- |
| `encryptionKey` | Buffer |
| `iv` | Buffer |
| `plaintext` | Buffer |

**Returns:** _Buffer‹›_

ciphertext

### AES128EncryptAndHMAC

▸ **AES128EncryptAndHMAC**\(`encryptionKey`: Buffer, `macKey`: Buffer, `plaintext`: Buffer\): _Buffer_

_Defined in_ [_packages/sdk/utils/src/ecies.ts:79_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L79)

AES-128 CTR encrypt with message authentication

**Parameters:**

| Name | Type |
| :--- | :--- |
| `encryptionKey` | Buffer |
| `macKey` | Buffer |
| `plaintext` | Buffer |

**Returns:** _Buffer_

ciphertext

### Decrypt

▸ **Decrypt**\(`privKey`: Buffer, `encrypted`: Buffer\): _Buffer‹›_

_Defined in_ [_packages/sdk/utils/src/ecies.ts:166_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L166)

ECIES decrypt

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `privKey` | Buffer | Ethereum private key, 32 bytes. |
| `encrypted` | Buffer | Encrypted message, serialized, 113+ bytes |

**Returns:** _Buffer‹›_

plaintext

### Encrypt

▸ **Encrypt**\(`pubKeyTo`: Buffer, `plaintext`: Buffer\): _Buffer‹›_

_Defined in_ [_packages/sdk/utils/src/ecies.ts:140_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L140)

ECIES encrypt

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `pubKeyTo` | Buffer | Ethereum pub key, 64 bytes. |
| `plaintext` | Buffer | Plaintext to be encrypted. |

**Returns:** _Buffer‹›_

Encrypted message, serialized, 113+ bytes

## Object literals

### `Const` ECIES

### ▪ **ECIES**: _object_

_Defined in_ [_packages/sdk/utils/src/ecies.ts:183_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L183)

### AES128DecryptAndHMAC

• **AES128DecryptAndHMAC**: [_AES128DecryptAndHMAC_](_packages_sdk_utils_src_ecies_.md#aes128decryptandhmac)

_Defined in_ [_packages/sdk/utils/src/ecies.ts:187_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L187)

### AES128EncryptAndHMAC

• **AES128EncryptAndHMAC**: [_AES128EncryptAndHMAC_](_packages_sdk_utils_src_ecies_.md#aes128encryptandhmac)

_Defined in_ [_packages/sdk/utils/src/ecies.ts:186_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L186)

### Decrypt

• **Decrypt**: [_Decrypt_](_packages_sdk_utils_src_ecies_.md#decrypt)

_Defined in_ [_packages/sdk/utils/src/ecies.ts:185_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L185)

### Encrypt

• **Encrypt**: [_Encrypt_](_packages_sdk_utils_src_ecies_.md#encrypt)

_Defined in_ [_packages/sdk/utils/src/ecies.ts:184_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L184)

