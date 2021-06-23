# Class: FileKeystore

## Hierarchy

* [KeystoreBase](_keystores_.keystorebase.md)

  ↳ **FileKeystore**

## Index

### Constructors

* [constructor](_keystores_.filekeystore.md#constructor)

### Methods

* [changeKeystorePassphrase](_keystores_.filekeystore.md#changekeystorepassphrase)
* [deleteKeystore](_keystores_.filekeystore.md#deletekeystore)
* [getAddress](_keystores_.filekeystore.md#getaddress)
* [getAddressMap](_keystores_.filekeystore.md#getaddressmap)
* [getAllKeystoreNames](_keystores_.filekeystore.md#getallkeystorenames)
* [getKeystoreName](_keystores_.filekeystore.md#getkeystorename)
* [getPrivateKey](_keystores_.filekeystore.md#getprivatekey)
* [getRawKeystore](_keystores_.filekeystore.md#getrawkeystore)
* [importPrivateKey](_keystores_.filekeystore.md#importprivatekey)
* [listKeystoreAddresses](_keystores_.filekeystore.md#listkeystoreaddresses)
* [persistKeystore](_keystores_.filekeystore.md#persistkeystore)
* [removeKeystore](_keystores_.filekeystore.md#removekeystore)

## Constructors

###  constructor

\+ **new FileKeystore**(`keystoreDir`: string): *[FileKeystore](_keystores_.filekeystore.md)*

*Defined in [keystores.ts:181](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L181)*

Creates (but does not overwrite existing) directory
for containing keystore entries.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keystoreDir` | string | Path to directory where keystore will be saved  |

**Returns:** *[FileKeystore](_keystores_.filekeystore.md)*

## Methods

###  changeKeystorePassphrase

▸ **changeKeystorePassphrase**(`address`: string, `oldPassphrase`: string, `newPassphrase`: string): *Promise‹void›*

*Inherited from [KeystoreBase](_keystores_.keystorebase.md).[changeKeystorePassphrase](_keystores_.keystorebase.md#changekeystorepassphrase)*

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

*Inherited from [KeystoreBase](_keystores_.keystorebase.md).[deleteKeystore](_keystores_.keystorebase.md#deletekeystore)*

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

*Inherited from [KeystoreBase](_keystores_.keystorebase.md).[getAddress](_keystores_.keystorebase.md#getaddress)*

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

*Inherited from [KeystoreBase](_keystores_.keystorebase.md).[getAddressMap](_keystores_.keystorebase.md#getaddressmap)*

*Defined in [keystores.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L74)*

Maps account addresses to their respective keystore entries (names)

**Returns:** *Promise‹Record‹string, string››*

Record with account addresses as keys, keystore entry names as values

___

###  getAllKeystoreNames

▸ **getAllKeystoreNames**(): *Promise‹string[]›*

*Overrides [KeystoreBase](_keystores_.keystorebase.md).[getAllKeystoreNames](_keystores_.keystorebase.md#abstract-getallkeystorenames)*

*Defined in [keystores.ts:198](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L198)*

**Returns:** *Promise‹string[]›*

List of file names (keystore entries) in the keystore

___

###  getKeystoreName

▸ **getKeystoreName**(`address`: string): *Promise‹string›*

*Inherited from [KeystoreBase](_keystores_.keystorebase.md).[getKeystoreName](_keystores_.keystorebase.md#getkeystorename)*

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

*Inherited from [KeystoreBase](_keystores_.keystorebase.md).[getPrivateKey](_keystores_.keystorebase.md#getprivatekey)*

*Defined in [keystores.ts:122](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L122)*

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

*Overrides [KeystoreBase](_keystores_.keystorebase.md).[getRawKeystore](_keystores_.keystorebase.md#abstract-getrawkeystore)*

*Defined in [keystores.ts:216](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L216)*

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

*Inherited from [KeystoreBase](_keystores_.keystorebase.md).[importPrivateKey](_keystores_.keystorebase.md#importprivatekey)*

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

*Inherited from [KeystoreBase](_keystores_.keystorebase.md).[listKeystoreAddresses](_keystores_.keystorebase.md#listkeystoreaddresses)*

*Defined in [keystores.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L66)*

Gets a list of all account addresses in the keystore

**Returns:** *Promise‹string[]›*

List of account address strings

___

###  persistKeystore

▸ **persistKeystore**(`keystoreName`: string, `keystore`: string): *void*

*Overrides [KeystoreBase](_keystores_.keystorebase.md).[persistKeystore](_keystores_.keystorebase.md#abstract-persistkeystore)*

*Defined in [keystores.ts:207](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L207)*

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

*Overrides [KeystoreBase](_keystores_.keystorebase.md).[removeKeystore](_keystores_.keystorebase.md#abstract-removekeystore)*

*Defined in [keystores.ts:224](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L224)*

Deletes file keystore entry from directory

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keystoreName` | string | File name of keystore entry to be removed  |

**Returns:** *void*
