# Class: KeystoreBase

## Hierarchy

* **KeystoreBase**

  ↳ [InMemoryKeystore](_keystores_.inmemorykeystore.md)

  ↳ [FileKeystore](_keystores_.filekeystore.md)

## Index

### Methods

* [changeKeystorePassphrase](_keystores_.keystorebase.md#changekeystorepassphrase)
* [deleteKeystore](_keystores_.keystorebase.md#deletekeystore)
* [getAddress](_keystores_.keystorebase.md#getaddress)
* [getAddressMap](_keystores_.keystorebase.md#getaddressmap)
* [getAllKeystoreNames](_keystores_.keystorebase.md#abstract-getallkeystorenames)
* [getKeystoreName](_keystores_.keystorebase.md#getkeystorename)
* [getPrivateKey](_keystores_.keystorebase.md#getprivatekey)
* [getRawKeystore](_keystores_.keystorebase.md#abstract-getrawkeystore)
* [importPrivateKey](_keystores_.keystorebase.md#importprivatekey)
* [listKeystoreAddresses](_keystores_.keystorebase.md#listkeystoreaddresses)
* [persistKeystore](_keystores_.keystorebase.md#abstract-persistkeystore)
* [removeKeystore](_keystores_.keystorebase.md#abstract-removekeystore)

## Methods

###  changeKeystorePassphrase

▸ **changeKeystorePassphrase**(`address`: string, `oldPassphrase`: string, `newPassphrase`: string): *Promise‹void›*

*Defined in [keystores.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L134)*

Change secret phrase used to encrypt the private key of an address

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Account address |
`oldPassphrase` | string | Secret phrase used to encrypt the private key |
`newPassphrase` | string | New secret phrase to re-encrypt the private key  |

**Returns:** *Promise‹void›*

___

###  deleteKeystore

▸ **deleteKeystore**(`address`: string): *Promise‹void›*

*Defined in [keystores.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L147)*

Permanently removes keystore entry from keystore

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Account address of keystore to be deleted  |

**Returns:** *Promise‹void›*

___

###  getAddress

▸ **getAddress**(`keystoreName`: string): *string*

*Defined in [keystores.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L53)*

Gets the address corresponding to a particular keystore entry

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keystoreName` | string | Name of keystore entry belonging to the address |

**Returns:** *string*

Account address

___

###  getAddressMap

▸ **getAddressMap**(): *Promise‹Record‹string, string››*

*Defined in [keystores.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L74)*

Maps account addresses to their respective keystore entries (names)

**Returns:** *Promise‹Record‹string, string››*

Record with account addresses as keys, keystore entry names as values

___

### `Abstract` getAllKeystoreNames

▸ **getAllKeystoreNames**(): *Promise‹string[]›*

*Defined in [keystores.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L40)*

Gets a list of the names of each entry in the keystore

**Returns:** *Promise‹string[]›*

___

###  getKeystoreName

▸ **getKeystoreName**(`address`: string): *Promise‹string›*

*Defined in [keystores.ts:108](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L108)*

Gets name of keystore entry corresponding to an address

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Account address |

**Returns:** *Promise‹string›*

Name of corresponding keystore entry

___

###  getPrivateKey

▸ **getPrivateKey**(`address`: string, `passphrase`: string): *Promise‹string›*

*Defined in [keystores.ts:122](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L122)*

Gets decrypted (plaintext) private key for an account address

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Account address |
`passphrase` | string | Secret phrase used to encrypt the private key |

**Returns:** *Promise‹string›*

___

### `Abstract` getRawKeystore

▸ **getRawKeystore**(`keystoreName`: string): *string*

*Defined in [keystores.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L35)*

Returns raw encrypted keystore entry string by name

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keystoreName` | string | Name of keystore entry to retrieve  |

**Returns:** *string*

___

###  importPrivateKey

▸ **importPrivateKey**(`privateKey`: string, `passphrase`: string): *Promise‹void›*

*Defined in [keystores.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L88)*

Encrypts and stores a private key as a new keystore entry

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`privateKey` | string | Private key to encrypted |
`passphrase` | string | Secret string to encrypt private key  |

**Returns:** *Promise‹void›*

___

###  listKeystoreAddresses

▸ **listKeystoreAddresses**(): *Promise‹string[]›*

*Defined in [keystores.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L66)*

Gets a list of all account addresses in the keystore

**Returns:** *Promise‹string[]›*

List of account address strings

___

### `Abstract` persistKeystore

▸ **persistKeystore**(`keystoreName`: string, `keystore`: string): *void*

*Defined in [keystores.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L29)*

Saves encrypted keystore entry (i.e. to disk, database, ...). Must be implemented by subclass.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keystoreName` | string | Name of keystore entry to be saved |
`keystore` | string | encrypted V3Keystore string entry  |

**Returns:** *void*

___

### `Abstract` removeKeystore

▸ **removeKeystore**(`keystoreName`: string): *void*

*Defined in [keystores.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L46)*

Removes keystore entry from keystore permanently

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keystoreName` | string | Name of keystore entry to remove  |

**Returns:** *void*
