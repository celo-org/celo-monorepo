[@celo/cryptographic-utils](../README.md) › [Globals](../globals.md) › ["packages/sdk/cryptographic-utils/src/commentEncryption"](_packages_sdk_cryptographic_utils_src_commentencryption_.md)

# Module: "packages/sdk/cryptographic-utils/src/commentEncryption"

## Index

### Interfaces

* [EncryptionStatus](../interfaces/_packages_sdk_cryptographic_utils_src_commentencryption_.encryptionstatus.md)

### Functions

* [decryptComment](_packages_sdk_cryptographic_utils_src_commentencryption_.md#decryptcomment)
* [decryptData](_packages_sdk_cryptographic_utils_src_commentencryption_.md#decryptdata)
* [encryptComment](_packages_sdk_cryptographic_utils_src_commentencryption_.md#encryptcomment)
* [encryptData](_packages_sdk_cryptographic_utils_src_commentencryption_.md#encryptdata)

### Object literals

* [CommentEncryptionUtils](_packages_sdk_cryptographic_utils_src_commentencryption_.md#const-commentencryptionutils)

## Functions

###  decryptComment

▸ **decryptComment**(`comment`: string, `key`: Buffer, `sender`: boolean): *[EncryptionStatus](../interfaces/_packages_sdk_cryptographic_utils_src_commentencryption_.encryptionstatus.md)*

*Defined in [packages/sdk/cryptographic-utils/src/commentEncryption.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/commentEncryption.ts#L104)*

Decrypts a comments encrypted by encryptComment. If it cannot decrypt the comment (i.e. comment was
never encrypted in the first place), it returns the comments without any changes.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`comment` | string | Comment to decrypt. If encrypted, base64 encoded. May be plaintext. |
`key` | Buffer | Private key to decrypt the message with. |
`sender` | boolean | If the decryptor is the sender of the message. |

**Returns:** *[EncryptionStatus](../interfaces/_packages_sdk_cryptographic_utils_src_commentencryption_.encryptionstatus.md)*

Decrypted comment if can decrypt, otherwise comment.

___

###  decryptData

▸ **decryptData**(`data`: Buffer, `key`: Buffer, `sender`: boolean): *Buffer*

*Defined in [packages/sdk/cryptographic-utils/src/commentEncryption.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/commentEncryption.ts#L45)*

Decrypts raw data that was encrypted by encryptData. Throws on error.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`data` | Buffer | Data to decrypt. |
`key` | Buffer | Private key to decrypt the message with. |
`sender` | boolean | If the decryptor is the sender of the message. |

**Returns:** *Buffer*

Decrypted data.

___

###  encryptComment

▸ **encryptComment**(`comment`: string, `pubKeyRecipient`: Buffer, `pubKeySelf`: Buffer): *[EncryptionStatus](../interfaces/_packages_sdk_cryptographic_utils_src_commentencryption_.encryptionstatus.md)*

*Defined in [packages/sdk/cryptographic-utils/src/commentEncryption.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/commentEncryption.ts#L69)*

Encrypts a comment. If it can encrypt, it returns a base64 string with the following:
   ECIES(session key to other) + ECIES(session key to self) + AES(comment)
If it fails to encrypt, it returns the comment without any changes.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`comment` | string | Comment to encrypt. |
`pubKeyRecipient` | Buffer | Public key of the recipient. May be compressed. |
`pubKeySelf` | Buffer | Public key of the sender. May be compressed. |

**Returns:** *[EncryptionStatus](../interfaces/_packages_sdk_cryptographic_utils_src_commentencryption_.encryptionstatus.md)*

base64 string of encrypted comment if can encrypt, otherwise comment.

___

###  encryptData

▸ **encryptData**(`data`: Buffer, `pubKeyRecipient`: Buffer, `pubKeySelf`: Buffer): *Buffer*

*Defined in [packages/sdk/cryptographic-utils/src/commentEncryption.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/commentEncryption.ts#L27)*

Encrypts a buffer to two recipients. Throws on error.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`data` | Buffer | Data to encrypt |
`pubKeyRecipient` | Buffer | Public key of the recipient. Uncompressed without leading 0x04. |
`pubKeySelf` | Buffer | Public key of the sender. Uncompressed without leading 0x04. |

**Returns:** *Buffer*

Encrypted data to sender and recipient.

## Object literals

### `Const` CommentEncryptionUtils

### ▪ **CommentEncryptionUtils**: *object*

*Defined in [packages/sdk/cryptographic-utils/src/commentEncryption.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/commentEncryption.ts#L115)*

###  decryptComment

• **decryptComment**: *[decryptComment](_packages_sdk_cryptographic_utils_src_commentencryption_.md#decryptcomment)*

*Defined in [packages/sdk/cryptographic-utils/src/commentEncryption.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/commentEncryption.ts#L117)*

###  encryptComment

• **encryptComment**: *[encryptComment](_packages_sdk_cryptographic_utils_src_commentencryption_.md#encryptcomment)*

*Defined in [packages/sdk/cryptographic-utils/src/commentEncryption.ts:116](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/commentEncryption.ts#L116)*
