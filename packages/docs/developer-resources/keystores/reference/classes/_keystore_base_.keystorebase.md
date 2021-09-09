# Class: KeystoreBase

## Hierarchy

* **KeystoreBase**

  ↳ [FileKeystore](_file_keystore_.filekeystore.md)

  ↳ [InMemoryKeystore](_inmemory_keystore_.inmemorykeystore.md)

## Index

### Methods

* [changeKeystorePassphrase](_keystore_base_.keystorebase.md#changekeystorepassphrase)
* [deleteKeystore](_keystore_base_.keystorebase.md#deletekeystore)
* [getAddress](_keystore_base_.keystorebase.md#getaddress)
* [getAddressMap](_keystore_base_.keystorebase.md#getaddressmap)
* [getAllKeystoreNames](_keystore_base_.keystorebase.md#abstract-getallkeystorenames)
* [getKeystoreName](_keystore_base_.keystorebase.md#getkeystorename)
* [getPrivateKey](_keystore_base_.keystorebase.md#getprivatekey)
* [getRawKeystore](_keystore_base_.keystorebase.md#abstract-getrawkeystore)
* [importPrivateKey](_keystore_base_.keystorebase.md#importprivatekey)
* [listKeystoreAddresses](_keystore_base_.keystorebase.md#listkeystoreaddresses)
* [persistKeystore](_keystore_base_.keystorebase.md#abstract-persistkeystore)
* [removeKeystore](_keystore_base_.keystorebase.md#abstract-removekeystore)

## Methods

###  changeKeystorePassphrase

▸ **changeKeystorePassphrase**(`address`: string, `oldPassphrase`: string, `newPassphrase`: string): *Promise‹void›*

*Defined in [keystore-base.ts:132](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L132)*

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

*Defined in [keystore-base.ts:145](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L145)*

Permanently removes keystore entry from keystore

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Account address of keystore to be deleted  |

**Returns:** *Promise‹void›*

___

###  getAddress

▸ **getAddress**(`keystoreName`: string): *string*

*Defined in [keystore-base.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L51)*

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

*Defined in [keystore-base.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L72)*

Maps account addresses to their respective keystore entries (names)

**Returns:** *Promise‹Record‹string, string››*

Record with account addresses as keys, keystore entry names as values

___

### `Abstract` getAllKeystoreNames

▸ **getAllKeystoreNames**(): *Promise‹string[]›*

*Defined in [keystore-base.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L38)*

Gets a list of the names of each entry in the keystore

**Returns:** *Promise‹string[]›*

___

###  getKeystoreName

▸ **getKeystoreName**(`address`: string): *Promise‹string›*

*Defined in [keystore-base.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L106)*

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

*Defined in [keystore-base.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L120)*

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

*Defined in [keystore-base.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L33)*

Returns raw encrypted keystore entry string by name

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keystoreName` | string | Name of keystore entry to retrieve  |

**Returns:** *string*

___

###  importPrivateKey

▸ **importPrivateKey**(`privateKey`: string, `passphrase`: string): *Promise‹void›*

*Defined in [keystore-base.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L86)*

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

*Defined in [keystore-base.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L64)*

Gets a list of all account addresses in the keystore

**Returns:** *Promise‹string[]›*

List of account address strings

___

### `Abstract` persistKeystore

▸ **persistKeystore**(`keystoreName`: string, `keystore`: string): *void*

*Defined in [keystore-base.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L27)*

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

*Defined in [keystore-base.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L44)*

Removes keystore entry from keystore permanently

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keystoreName` | string | Name of keystore entry to remove  |

**Returns:** *void*
