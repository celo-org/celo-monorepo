# Class: FileKeystore

## Hierarchy

* [KeystoreBase](_keystore_base_.keystorebase.md)

  ↳ **FileKeystore**

## Index

### Constructors

* [constructor](_file_keystore_.filekeystore.md#constructor)

### Methods

* [changeKeystorePassphrase](_file_keystore_.filekeystore.md#changekeystorepassphrase)
* [deleteKeystore](_file_keystore_.filekeystore.md#deletekeystore)
* [getAddress](_file_keystore_.filekeystore.md#getaddress)
* [getAddressMap](_file_keystore_.filekeystore.md#getaddressmap)
* [getAllKeystoreNames](_file_keystore_.filekeystore.md#getallkeystorenames)
* [getKeystoreName](_file_keystore_.filekeystore.md#getkeystorename)
* [getPrivateKey](_file_keystore_.filekeystore.md#getprivatekey)
* [getRawKeystore](_file_keystore_.filekeystore.md#getrawkeystore)
* [importPrivateKey](_file_keystore_.filekeystore.md#importprivatekey)
* [listKeystoreAddresses](_file_keystore_.filekeystore.md#listkeystoreaddresses)
* [persistKeystore](_file_keystore_.filekeystore.md#persistkeystore)
* [removeKeystore](_file_keystore_.filekeystore.md#removekeystore)

## Constructors

###  constructor

\+ **new FileKeystore**(`keystoreDir`: string): *[FileKeystore](_file_keystore_.filekeystore.md)*

*Defined in [file-keystore.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/file-keystore.ts#L10)*

Creates (but does not overwrite existing) directory
for containing keystore entries.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keystoreDir` | string | Path to directory where keystore will be saved  |

**Returns:** *[FileKeystore](_file_keystore_.filekeystore.md)*

## Methods

###  changeKeystorePassphrase

▸ **changeKeystorePassphrase**(`address`: string, `oldPassphrase`: string, `newPassphrase`: string): *Promise‹void›*

*Inherited from [KeystoreBase](_keystore_base_.keystorebase.md).[changeKeystorePassphrase](_keystore_base_.keystorebase.md#changekeystorepassphrase)*

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

*Inherited from [KeystoreBase](_keystore_base_.keystorebase.md).[deleteKeystore](_keystore_base_.keystorebase.md#deletekeystore)*

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

*Inherited from [KeystoreBase](_keystore_base_.keystorebase.md).[getAddress](_keystore_base_.keystorebase.md#getaddress)*

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

*Inherited from [KeystoreBase](_keystore_base_.keystorebase.md).[getAddressMap](_keystore_base_.keystorebase.md#getaddressmap)*

*Defined in [keystore-base.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L72)*

Maps account addresses to their respective keystore entries (names)

**Returns:** *Promise‹Record‹string, string››*

Record with account addresses as keys, keystore entry names as values

___

###  getAllKeystoreNames

▸ **getAllKeystoreNames**(): *Promise‹string[]›*

*Overrides [KeystoreBase](_keystore_base_.keystorebase.md).[getAllKeystoreNames](_keystore_base_.keystorebase.md#abstract-getallkeystorenames)*

*Defined in [file-keystore.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/file-keystore.ts#L27)*

**Returns:** *Promise‹string[]›*

List of file names (keystore entries) in the keystore

___

###  getKeystoreName

▸ **getKeystoreName**(`address`: string): *Promise‹string›*

*Inherited from [KeystoreBase](_keystore_base_.keystorebase.md).[getKeystoreName](_keystore_base_.keystorebase.md#getkeystorename)*

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

*Inherited from [KeystoreBase](_keystore_base_.keystorebase.md).[getPrivateKey](_keystore_base_.keystorebase.md#getprivatekey)*

*Defined in [keystore-base.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L120)*

Gets decrypted (plaintext) private key for an account address

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Account address |
`passphrase` | string | Secret phrase used to encrypt the private key |

**Returns:** *Promise‹string›*

___

###  getRawKeystore

▸ **getRawKeystore**(`keystoreName`: string): *string*

*Overrides [KeystoreBase](_keystore_base_.keystorebase.md).[getRawKeystore](_keystore_base_.keystorebase.md#abstract-getrawkeystore)*

*Defined in [file-keystore.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/file-keystore.ts#L45)*

Gets contents of keystore entry file

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keystoreName` | string | File name of keystore entry |

**Returns:** *string*

V3Keystore string entry

___

###  importPrivateKey

▸ **importPrivateKey**(`privateKey`: string, `passphrase`: string): *Promise‹void›*

*Inherited from [KeystoreBase](_keystore_base_.keystorebase.md).[importPrivateKey](_keystore_base_.keystorebase.md#importprivatekey)*

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

*Inherited from [KeystoreBase](_keystore_base_.keystorebase.md).[listKeystoreAddresses](_keystore_base_.keystorebase.md#listkeystoreaddresses)*

*Defined in [keystore-base.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L64)*

Gets a list of all account addresses in the keystore

**Returns:** *Promise‹string[]›*

List of account address strings

___

###  persistKeystore

▸ **persistKeystore**(`keystoreName`: string, `keystore`: string): *void*

*Overrides [KeystoreBase](_keystore_base_.keystorebase.md).[persistKeystore](_keystore_base_.keystorebase.md#abstract-persistkeystore)*

*Defined in [file-keystore.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/file-keystore.ts#L36)*

Saves keystore entries as a file in the keystore directory

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keystoreName` | string | File name of keystore entry |
`keystore` | string | V3Keystore string entry  |

**Returns:** *void*

___

###  removeKeystore

▸ **removeKeystore**(`keystoreName`: string): *void*

*Overrides [KeystoreBase](_keystore_base_.keystorebase.md).[removeKeystore](_keystore_base_.keystorebase.md#abstract-removekeystore)*

*Defined in [file-keystore.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/file-keystore.ts#L53)*

Deletes file keystore entry from directory

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keystoreName` | string | File name of keystore entry to be removed  |

**Returns:** *void*
