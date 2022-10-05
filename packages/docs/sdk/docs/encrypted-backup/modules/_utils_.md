[@celo/encrypted-backup](../README.md) › ["utils"](_utils_.md)

# Module: "utils"

## Index

### Enumerations

* [KDFInfo](../enums/_utils_.kdfinfo.md)

### Interfaces

* [ScryptOptions](../interfaces/_utils_.scryptoptions.md)

### Type aliases

* [EIP712Wallet](_utils_.md#eip712wallet)

### Functions

* [computationalHardenKey](_utils_.md#computationalhardenkey)
* [decrypt](_utils_.md#decrypt)
* [deriveKey](_utils_.md#derivekey)
* [encrypt](_utils_.md#encrypt)
* [pbkdf2](_utils_.md#pbkdf2)
* [scrypt](_utils_.md#scrypt)

## Type aliases

###  EIP712Wallet

Ƭ **EIP712Wallet**: *Pick‹ReadOnlyWallet, "getAccounts" | "hasAccount" | "signTypedData"›*

*Defined in [packages/sdk/encrypted-backup/src/utils.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/utils.ts#L11)*

Pared down ReadOnlyWallet type that supports the required functions of EIP-712 signing.

## Functions

###  computationalHardenKey

▸ **computationalHardenKey**(`key`: Buffer, `config`: [ComputationalHardeningConfig](_config_.md#computationalhardeningconfig)): *Promise‹Result‹Buffer, [PbkdfError](../classes/_errors_.pbkdferror.md) | [ScryptError](../classes/_errors_.scrypterror.md)››*

*Defined in [packages/sdk/encrypted-backup/src/utils.ts:148](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/utils.ts#L148)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | Buffer |
`config` | [ComputationalHardeningConfig](_config_.md#computationalhardeningconfig) |

**Returns:** *Promise‹Result‹Buffer, [PbkdfError](../classes/_errors_.pbkdferror.md) | [ScryptError](../classes/_errors_.scrypterror.md)››*

___

###  decrypt

▸ **decrypt**(`key`: Buffer, `ciphertext`: Buffer): *Result‹Buffer, [DecryptionError](../classes/_errors_.decryptionerror.md)›*

*Defined in [packages/sdk/encrypted-backup/src/utils.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/utils.ts#L66)*

AES-256-GCM decrypt the given data with the given 32-byte key.
Ciphertext should be encoded as { iv || data || auth tag }.

**Parameters:**

Name | Type |
------ | ------ |
`key` | Buffer |
`ciphertext` | Buffer |

**Returns:** *Result‹Buffer, [DecryptionError](../classes/_errors_.decryptionerror.md)›*

___

###  deriveKey

▸ **deriveKey**(`info`: [KDFInfo](../enums/_utils_.kdfinfo.md), `sources`: Buffer[]): *Buffer*

*Defined in [packages/sdk/encrypted-backup/src/utils.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/utils.ts#L34)*

Key derivation function for mixing source keying material.

**`remarks`** This function does not add any hardening to the input keying material. It is used only
to mix the provided key material sources. It's output should not be used to directly derive a key
from a password or other low entropy sources.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`info` | [KDFInfo](../enums/_utils_.kdfinfo.md) | Fixed string value used for domain separation. |
`sources` | Buffer[] | An array of keying material source values (e.g. a password and a nonce).  |

**Returns:** *Buffer*

___

###  encrypt

▸ **encrypt**(`key`: Buffer, `data`: Buffer): *Result‹Buffer, [EncryptionError](../classes/_errors_.encryptionerror.md)›*

*Defined in [packages/sdk/encrypted-backup/src/utils.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/utils.ts#L51)*

AES-256-GCM encrypt the given data with the given 32-byte key.
Encode the ciphertext as { iv || data || auth tag }

**Parameters:**

Name | Type |
------ | ------ |
`key` | Buffer |
`data` | Buffer |

**Returns:** *Result‹Buffer, [EncryptionError](../classes/_errors_.encryptionerror.md)›*

___

###  pbkdf2

▸ **pbkdf2**(`key`: Buffer, `iterations`: number): *Promise‹Result‹Buffer, [PbkdfError](../classes/_errors_.pbkdferror.md)››*

*Defined in [packages/sdk/encrypted-backup/src/utils.ts:103](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/utils.ts#L103)*

PBKDF2-SHA256 computational key hardening.

**`remarks`** When possible, a memory hard function such as scrypt should be used instead.
No salt parameter is provided as the intended use case of this function is to harden a
key value which is derived from a password but already has the salt mixed in.

**`see`** { @link
https://nodejs.org/api/crypto.html#cryptopbkdf2password-salt-iterations-keylen-digest-callback |
NodeJS crypto.pbkdf2 API }

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`key` | Buffer | Key buffer to compute hardening against. Should have a salt or nonce mixed in. |
`iterations` | number | Number of PBKDF2 iterations to execute for key hardening.  |

**Returns:** *Promise‹Result‹Buffer, [PbkdfError](../classes/_errors_.pbkdferror.md)››*

___

###  scrypt

▸ **scrypt**(`key`: Buffer, `options`: [ScryptOptions](../interfaces/_utils_.scryptoptions.md)): *Promise‹Result‹Buffer, [ScryptError](../classes/_errors_.scrypterror.md)››*

*Defined in [packages/sdk/encrypted-backup/src/utils.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/utils.ts#L134)*

scrypt computational key hardening.

**`remarks`** No salt parameter is provided as the intended use case of this function is to harden a
key value which is derived from a password but already has the salt mixed in.

**`see`** { @link
https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback |
NodeJS crypto.scrypt API }

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`key` | Buffer | Key buffer to compute hardening against. Should have a salt or nonce mixed in. |
`options` | [ScryptOptions](../interfaces/_utils_.scryptoptions.md) | Options to control the cost of the scrypt function.  |

**Returns:** *Promise‹Result‹Buffer, [ScryptError](../classes/_errors_.scrypterror.md)››*
