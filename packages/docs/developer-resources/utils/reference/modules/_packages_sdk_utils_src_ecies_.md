# Module: "packages/sdk/utils/src/ecies"

## Index

### Variables

* [IV_LENGTH](_packages_sdk_utils_src_ecies_.md#const-iv_length)

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

### `Const` IV_LENGTH

• **IV_LENGTH**: *16* = 16

*Defined in [packages/sdk/utils/src/ecies.ts:13](https://github.com/spruceid/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L13)*

## Functions

###  AES128Decrypt

▸ **AES128Decrypt**(`encryptionKey`: Buffer, `iv`: Buffer, `ciphertext`: Buffer): *Buffer‹›*

*Defined in [packages/sdk/utils/src/ecies.ts:98](https://github.com/spruceid/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L98)*

AES-128 CTR decrypt

**Parameters:**

Name | Type |
------ | ------ |
`encryptionKey` | Buffer |
`iv` | Buffer |
`ciphertext` | Buffer |

**Returns:** *Buffer‹›*

plaintext

___

###  AES128DecryptAndHMAC

▸ **AES128DecryptAndHMAC**(`encryptionKey`: Buffer, `macKey`: Buffer, `ciphertext`: Buffer): *Buffer*

*Defined in [packages/sdk/utils/src/ecies.ts:113](https://github.com/spruceid/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L113)*

AES-128 CTR decrypt with message authentication

**Parameters:**

Name | Type |
------ | ------ |
`encryptionKey` | Buffer |
`macKey` | Buffer |
`ciphertext` | Buffer |

**Returns:** *Buffer*

plaintext

___

###  AES128Encrypt

▸ **AES128Encrypt**(`encryptionKey`: Buffer, `iv`: Buffer, `plaintext`: Buffer): *Buffer‹›*

*Defined in [packages/sdk/utils/src/ecies.ts:65](https://github.com/spruceid/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L65)*

AES-128 CTR encrypt

**Parameters:**

Name | Type |
------ | ------ |
`encryptionKey` | Buffer |
`iv` | Buffer |
`plaintext` | Buffer |

**Returns:** *Buffer‹›*

ciphertext

___

###  AES128EncryptAndHMAC

▸ **AES128EncryptAndHMAC**(`encryptionKey`: Buffer, `macKey`: Buffer, `plaintext`: Buffer): *Buffer*

*Defined in [packages/sdk/utils/src/ecies.ts:79](https://github.com/spruceid/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L79)*

AES-128 CTR encrypt with message authentication

**Parameters:**

Name | Type |
------ | ------ |
`encryptionKey` | Buffer |
`macKey` | Buffer |
`plaintext` | Buffer |

**Returns:** *Buffer*

ciphertext

___

###  Decrypt

▸ **Decrypt**(`privKey`: Buffer, `encrypted`: Buffer): *Buffer‹›*

*Defined in [packages/sdk/utils/src/ecies.ts:160](https://github.com/spruceid/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L160)*

ECIES decrypt

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`privKey` | Buffer | Ethereum private key, 32 bytes. |
`encrypted` | Buffer | Encrypted message, serialized, 113+ bytes |

**Returns:** *Buffer‹›*

plaintext

___

###  Encrypt

▸ **Encrypt**(`pubKeyTo`: Buffer, `plaintext`: Buffer): *Buffer‹›*

*Defined in [packages/sdk/utils/src/ecies.ts:136](https://github.com/spruceid/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L136)*

ECIES encrypt

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`pubKeyTo` | Buffer | Ethereum pub key, 64 bytes. |
`plaintext` | Buffer | Plaintext to be encrypted. |

**Returns:** *Buffer‹›*

Encrypted message, serialized, 113+ bytes

## Object literals

### `Const` ECIES

### ▪ **ECIES**: *object*

*Defined in [packages/sdk/utils/src/ecies.ts:175](https://github.com/spruceid/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L175)*

###  AES128DecryptAndHMAC

• **AES128DecryptAndHMAC**: *[AES128DecryptAndHMAC](_packages_sdk_utils_src_ecies_.md#aes128decryptandhmac)*

*Defined in [packages/sdk/utils/src/ecies.ts:179](https://github.com/spruceid/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L179)*

###  AES128EncryptAndHMAC

• **AES128EncryptAndHMAC**: *[AES128EncryptAndHMAC](_packages_sdk_utils_src_ecies_.md#aes128encryptandhmac)*

*Defined in [packages/sdk/utils/src/ecies.ts:178](https://github.com/spruceid/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L178)*

###  Decrypt

• **Decrypt**: *[Decrypt](_packages_sdk_utils_src_ecies_.md#decrypt)*

*Defined in [packages/sdk/utils/src/ecies.ts:177](https://github.com/spruceid/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L177)*

###  Encrypt

• **Encrypt**: *[Encrypt](_packages_sdk_utils_src_ecies_.md#encrypt)*

*Defined in [packages/sdk/utils/src/ecies.ts:176](https://github.com/spruceid/celo-monorepo/blob/master/packages/sdk/utils/src/ecies.ts#L176)*
