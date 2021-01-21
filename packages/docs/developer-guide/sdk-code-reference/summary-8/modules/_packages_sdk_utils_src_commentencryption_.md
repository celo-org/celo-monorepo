# packages/sdk/utils/src/commentEncryption

## Index

### Interfaces

* [EncryptionStatus]()

### Functions

* [decryptComment](_packages_sdk_utils_src_commentencryption_.md#decryptcomment)
* [decryptData](_packages_sdk_utils_src_commentencryption_.md#decryptdata)
* [encryptComment](_packages_sdk_utils_src_commentencryption_.md#encryptcomment)
* [encryptData](_packages_sdk_utils_src_commentencryption_.md#encryptdata)

### Object literals

* [CommentEncryptionUtils](_packages_sdk_utils_src_commentencryption_.md#const-commentencryptionutils)

## Functions

### decryptComment

▸ **decryptComment**\(`comment`: string, `key`: Buffer, `sender`: boolean\): [_EncryptionStatus_]()

_Defined in_ [_packages/sdk/utils/src/commentEncryption.ts:104_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/commentEncryption.ts#L104)

Decrypts a comments encrypted by encryptComment. If it cannot decrypt the comment \(i.e. comment was never encrypted in the first place\), it returns the comments without any changes.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `comment` | string | Comment to decrypt. If encrypted, base64 encoded. May be plaintext. |
| `key` | Buffer | Private key to decrypt the message with. |
| `sender` | boolean | If the decryptor is the sender of the message. |

**Returns:** [_EncryptionStatus_]()

Decrypted comment if can decrypt, otherwise comment.

### decryptData

▸ **decryptData**\(`data`: Buffer, `key`: Buffer, `sender`: boolean\): _Buffer_

_Defined in_ [_packages/sdk/utils/src/commentEncryption.ts:45_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/commentEncryption.ts#L45)

Decrypts raw data that was encrypted by encryptData. Throws on error.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `data` | Buffer | Data to decrypt. |
| `key` | Buffer | Private key to decrypt the message with. |
| `sender` | boolean | If the decryptor is the sender of the message. |

**Returns:** _Buffer_

Decrypted data.

### encryptComment

▸ **encryptComment**\(`comment`: string, `pubKeyRecipient`: Buffer, `pubKeySelf`: Buffer\): [_EncryptionStatus_]()

_Defined in_ [_packages/sdk/utils/src/commentEncryption.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/commentEncryption.ts#L69)

Encrypts a comment. If it can encrypt, it returns a base64 string with the following: ECIES\(session key to other\) + ECIES\(session key to self\) + AES\(comment\) If it fails to encrypt, it returns the comment without any changes.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `comment` | string | Comment to encrypt. |
| `pubKeyRecipient` | Buffer | Public key of the recipient. May be compressed. |
| `pubKeySelf` | Buffer | Public key of the sender. May be compressed. |

**Returns:** [_EncryptionStatus_]()

base64 string of encrypted comment if can encrypt, otherwise comment.

### encryptData

▸ **encryptData**\(`data`: Buffer, `pubKeyRecipient`: Buffer, `pubKeySelf`: Buffer\): _Buffer_

_Defined in_ [_packages/sdk/utils/src/commentEncryption.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/commentEncryption.ts#L27)

Encrypts a buffer to two recipients. Throws on error.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `data` | Buffer | Data to encrypt |
| `pubKeyRecipient` | Buffer | Public key of the recipient. Uncompressed without leading 0x04. |
| `pubKeySelf` | Buffer | Public key of the sender. Uncompressed without leading 0x04. |

**Returns:** _Buffer_

Encrypted data to sender and recipient.

## Object literals

### `Const` CommentEncryptionUtils

### ▪ **CommentEncryptionUtils**: _object_

_Defined in_ [_packages/sdk/utils/src/commentEncryption.ts:115_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/commentEncryption.ts#L115)

### decryptComment

• **decryptComment**: [_decryptComment_](_packages_sdk_utils_src_commentencryption_.md#decryptcomment)

_Defined in_ [_packages/sdk/utils/src/commentEncryption.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/commentEncryption.ts#L117)

### encryptComment

• **encryptComment**: [_encryptComment_](_packages_sdk_utils_src_commentencryption_.md#encryptcomment)

_Defined in_ [_packages/sdk/utils/src/commentEncryption.ts:116_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/commentEncryption.ts#L116)

