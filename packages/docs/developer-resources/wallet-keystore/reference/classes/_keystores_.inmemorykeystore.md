# Class: InMemoryKeystore

## Hierarchy

* [KeystoreBase](_keystores_.keystorebase.md)

  ↳ **InMemoryKeystore**

## Index

### Methods

* [changeKeystorePassphrase](_keystores_.inmemorykeystore.md#changekeystorepassphrase)
* [deleteKeystore](_keystores_.inmemorykeystore.md#deletekeystore)
* [getAddress](_keystores_.inmemorykeystore.md#getaddress)
* [getAddressMap](_keystores_.inmemorykeystore.md#getaddressmap)
* [getAllKeystoreNames](_keystores_.inmemorykeystore.md#getallkeystorenames)
* [getKeystoreName](_keystores_.inmemorykeystore.md#getkeystorename)
* [getPrivateKey](_keystores_.inmemorykeystore.md#getprivatekey)
* [getRawKeystore](_keystores_.inmemorykeystore.md#getrawkeystore)
* [importPrivateKey](_keystores_.inmemorykeystore.md#importprivatekey)
* [listKeystoreAddresses](_keystores_.inmemorykeystore.md#listkeystoreaddresses)
* [persistKeystore](_keystores_.inmemorykeystore.md#persistkeystore)
* [removeKeystore](_keystores_.inmemorykeystore.md#removekeystore)

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

*Defined in [keystores.ts:167](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L167)*

**Returns:** *Promise‹string[]›*

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

*Defined in [keystores.ts:163](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L163)*

**Parameters:**

Name | Type |
------ | ------ |
`keystoreName` | string |

**Returns:** *string*

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

*Defined in [keystores.ts:159](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L159)*

**Parameters:**

Name | Type |
------ | ------ |
`keystoreName` | string |
`keystore` | string |

**Returns:** *void*

___

###  removeKeystore

▸ **removeKeystore**(`keystoreName`: string): *void*

*Overrides [KeystoreBase](_keystores_.keystorebase.md).[removeKeystore](_keystores_.keystorebase.md#abstract-removekeystore)*

*Defined in [keystores.ts:171](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-keystore/src/keystores.ts#L171)*

**Parameters:**

Name | Type |
------ | ------ |
`keystoreName` | string |

**Returns:** *void*
