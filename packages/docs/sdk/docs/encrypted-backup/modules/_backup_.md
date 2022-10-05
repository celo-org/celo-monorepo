[@celo/encrypted-backup](../README.md) › ["backup"](_backup_.md)

# Module: "backup"

## Index

### Interfaces

* [Backup](../interfaces/_backup_.backup.md)
* [CreateBackupArgs](../interfaces/_backup_.createbackupargs.md)
* [CreatePasswordEncryptedBackupArgs](../interfaces/_backup_.createpasswordencryptedbackupargs.md)
* [CreatePinEncryptedBackupArgs](../interfaces/_backup_.createpinencryptedbackupargs.md)
* [OpenBackupArgs](../interfaces/_backup_.openbackupargs.md)

### Functions

* [createBackup](_backup_.md#createbackup)
* [createPasswordEncryptedBackup](_backup_.md#createpasswordencryptedbackup)
* [createPinEncryptedBackup](_backup_.md#createpinencryptedbackup)
* [openBackup](_backup_.md#openbackup)

## Functions

###  createBackup

▸ **createBackup**(`__namedParameters`: object): *Promise‹Result‹[Backup](../interfaces/_backup_.backup.md), [BackupError](_errors_.md#backuperror)››*

*Defined in [packages/sdk/encrypted-backup/src/backup.ts:247](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/backup.ts#L247)*

Create a data backup, encrypting it with a hardened key derived from the given password or PIN.

**`privateremarks`** Most of this functions code is devoted to key generation starting with the input
password or PIN and ending up with a hardened encryption key. It is important that the order and
inputs to each step in the derivation be well considered and implemented correctly. One important
requirement is that no output included in the backup acts as a "commitment" to the password or PIN
value, except the final ciphertext. An example of an issue with this would be if a hash of the
password and nonce were included in the backup. If a commitment to the password or PIN is
included, an attacker can locally brute force that commitment to recover the password, then use
that knowledge to complete the derivation.

**Parameters:**

▪ **__namedParameters**: *object*

Name | Type | Description |
------ | ------ | ------ |
`data` | Buffer‹› | The secret data (e.g. BIP-39 mnemonic phrase) to be included in the encrypted backup. |
`hardening` | [HardeningConfig](../interfaces/_config_.hardeningconfig.md) | Configuration for how the password should be hardened in deriving the key. |
`metadata` | undefined &#124; object | Arbitrary key-value data to include in the backup to identify it.  |
`userSecret` | string &#124; Buffer‹› | Password, PIN, or other user secret to use in deriving the encryption key.  If a string is provided, it will be UTF-8 encoded into a Buffer before use. |

**Returns:** *Promise‹Result‹[Backup](../interfaces/_backup_.backup.md), [BackupError](_errors_.md#backuperror)››*

___

###  createPasswordEncryptedBackup

▸ **createPasswordEncryptedBackup**(`__namedParameters`: object): *Promise‹Result‹[Backup](../interfaces/_backup_.backup.md), [BackupError](_errors_.md#backuperror)››*

*Defined in [packages/sdk/encrypted-backup/src/backup.ts:202](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/backup.ts#L202)*

Create a data backup, encrypting it with a hardened key derived from the given password.

**`remarks`** Because passwords have moderate entropy, the total number of guesses is restricted.
  * The user initially gets 5 attempts without delay.
  * Then the user gets two attempts every 5 seconds for up to 20 attempts.
  * Then the user gets two attempts every 30 seconds for up to 20 attempts.
  * Then the user gets two attempts every 5 minutes for up to 20 attempts.
  * Then the user gets two attempts every hour for up to 20 attempts.
  * Then the user gets two attempts every day for up to 20 attempts.

Following guidelines in NIST-800-63-3 it is strongly recommended that the caller apply a password
blocklist to the users choice of password.

In order to handle the event of an ODIS service compromise, this configuration additionally
hardens the password input with a computational hardening function. In particular, scrypt is used
with IETF recommended parameters [IETF recommended scrypt parameters](https://tools.ietf.org/id/draft-whited-kitten-password-storage-00.html#name-scrypt)

**Parameters:**

▪ **__namedParameters**: *object*

Name | Type | Description |
------ | ------ | ------ |
`data` | Buffer‹› | The secret data (e.g. BIP-39 mnemonic phrase) to be included in the encrypted backup. |
`environment` | undefined &#124; [MAINNET](../enums/_config_.environmentidentifier.md#mainnet) &#124; [ALFAJORES](../enums/_config_.environmentidentifier.md#alfajores) | - |
`metadata` | undefined &#124; object | Arbitrary key-value data to include in the backup to identify it.  |
`password` | string | Password to use in deriving the encryption key. |

**Returns:** *Promise‹Result‹[Backup](../interfaces/_backup_.backup.md), [BackupError](_errors_.md#backuperror)››*

___

###  createPinEncryptedBackup

▸ **createPinEncryptedBackup**(`__namedParameters`: object): *Promise‹Result‹[Backup](../interfaces/_backup_.backup.md), [BackupError](_errors_.md#backuperror)››*

*Defined in [packages/sdk/encrypted-backup/src/backup.ts:150](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/backup.ts#L150)*

Create a data backup, encrypting it with a hardened key derived from the given PIN.

**`remarks`** Using a 4 or 6 digit PIN for encryption requires an extremely restrictive rate limit for
attempts to guess the PIN. This is enforced by ODIS through the SequentialDelayDomain with
settings to allow the user (or an attacker) only a fixed number of attempts to guess their PIN.

Because PINs have very little entropy, the total number of guesses is very restricted.
  * On the first day, the client has 10 attempts. 5 within 10s. 5 more over roughly 45 minutes.
  * On the second day, the client has 5 attempts over roughly 2 minutes.
  * On the third day, the client has 3 attempts over roughly 40 seconds.
  * On the fourth day, the client has 2 attempts over roughly 10 seconds.
  * Overall, the client has 25 attempts over 4 days. All further attempts will be denied.

It is strongly recommended that the calling application implement a PIN blocklist to prevent the
user from selecting a number of the most common PIN codes (e.g. blocking the top 25k PINs by
frequency of appearance in the HIBP Passwords dataset). An example implementation can be seen in
the Valora wallet. [PIN blocklist implementation](https://github.com/valora-inc/wallet/blob/3940661c40d08e4c5db952bd0abeaabb0030fc7a/packages/mobile/src/pincode/authentication.ts#L56-L108)

In order to handle the event of an ODIS service compromise, this configuration additionally
includes a circuit breaker service run by Valora. In the event of an ODIS compromise, the Valora
team will take their service offline, preventing backups using the circuit breaker from being
opened. This ensures that an attacker who has compromised ODIS cannot leverage their attack to
forcibly open backups created with this function.

**Parameters:**

▪ **__namedParameters**: *object*

Name | Type | Description |
------ | ------ | ------ |
`data` | Buffer‹› | The secret data (e.g. BIP-39 mnemonic phrase) to be included in the encrypted backup. |
`environment` | undefined &#124; [MAINNET](../enums/_config_.environmentidentifier.md#mainnet) &#124; [ALFAJORES](../enums/_config_.environmentidentifier.md#alfajores) | - |
`metadata` | undefined &#124; object | Arbitrary key-value data to include in the backup to identify it.  |
`pin` | string | PIN to use in deriving the encryption key. |

**Returns:** *Promise‹Result‹[Backup](../interfaces/_backup_.backup.md), [BackupError](_errors_.md#backuperror)››*

___

###  openBackup

▸ **openBackup**(`__namedParameters`: object): *Promise‹Result‹Buffer, [BackupError](_errors_.md#backuperror)››*

*Defined in [packages/sdk/encrypted-backup/src/backup.ts:394](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/backup.ts#L394)*

Open an encrypted backup file, using the provided password or PIN to derive the decryption key.

**Parameters:**

▪ **__namedParameters**: *object*

Name | Type | Description |
------ | ------ | ------ |
`backup` | [Backup](../interfaces/_backup_.backup.md) | Backup structure including the ciphertext and key derivation information. |
`userSecret` | string &#124; Buffer‹› | Password, PIN, or other user secret to use in deriving the encryption key.  If a string is provided, it will be UTF-8 encoded into a Buffer before use.  |

**Returns:** *Promise‹Result‹Buffer, [BackupError](_errors_.md#backuperror)››*
