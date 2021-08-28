# InMemoryKeystore

## Hierarchy

* [KeystoreBase]()

  ↳ **InMemoryKeystore**

## Index

### Methods

* [changeKeystorePassphrase]()
* [deleteKeystore]()
* [getAddress]()
* [getAddressMap]()
* [getAllKeystoreNames]()
* [getKeystoreName]()
* [getPrivateKey]()
* [getRawKeystore]()
* [importPrivateKey]()
* [listKeystoreAddresses]()
* [persistKeystore]()
* [removeKeystore]()

## Methods

### changeKeystorePassphrase

▸ **changeKeystorePassphrase**\(`address`: string, `oldPassphrase`: string, `newPassphrase`: string\): _Promise‹void›_

_Inherited from_ [_KeystoreBase_]()_._[_changeKeystorePassphrase_]()

_Defined in_ [_keystore-base.ts:132_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L132)

Change secret phrase used to encrypt the private key of an address

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | string | Account address |
| `oldPassphrase` | string | Secret phrase used to encrypt the private key |
| `newPassphrase` | string | New secret phrase to re-encrypt the private key |

**Returns:** _Promise‹void›_

### deleteKeystore

▸ **deleteKeystore**\(`address`: string\): _Promise‹void›_

_Inherited from_ [_KeystoreBase_]()_._[_deleteKeystore_]()

_Defined in_ [_keystore-base.ts:145_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L145)

Permanently removes keystore entry from keystore

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | string | Account address of keystore to be deleted |

**Returns:** _Promise‹void›_

### getAddress

▸ **getAddress**\(`keystoreName`: string\): _string_

_Inherited from_ [_KeystoreBase_]()_._[_getAddress_]()

_Defined in_ [_keystore-base.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L51)

Gets the address corresponding to a particular keystore entry

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `keystoreName` | string | Name of keystore entry belonging to the address |

**Returns:** _string_

Account address

### getAddressMap

▸ **getAddressMap**\(\): _Promise‹Record‹string, string››_

_Inherited from_ [_KeystoreBase_]()_._[_getAddressMap_]()

_Defined in_ [_keystore-base.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L72)

Maps account addresses to their respective keystore entries \(names\)

**Returns:** _Promise‹Record‹string, string››_

Record with account addresses as keys, keystore entry names as values

### getAllKeystoreNames

▸ **getAllKeystoreNames**\(\): _Promise‹string\[\]›_

_Overrides_ [_KeystoreBase_]()_._[_getAllKeystoreNames_]()

_Defined in_ [_inmemory-keystore.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/inmemory-keystore.ts#L18)

**Returns:** _Promise‹string\[\]›_

### getKeystoreName

▸ **getKeystoreName**\(`address`: string\): _Promise‹string›_

_Inherited from_ [_KeystoreBase_]()_._[_getKeystoreName_]()

_Defined in_ [_keystore-base.ts:106_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L106)

Gets name of keystore entry corresponding to an address

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | string | Account address |

**Returns:** _Promise‹string›_

Name of corresponding keystore entry

### getPrivateKey

▸ **getPrivateKey**\(`address`: string, `passphrase`: string\): _Promise‹string›_

_Inherited from_ [_KeystoreBase_]()_._[_getPrivateKey_]()

_Defined in_ [_keystore-base.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L120)

Gets decrypted \(plaintext\) private key for an account address

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | string | Account address |
| `passphrase` | string | Secret phrase used to encrypt the private key |

**Returns:** _Promise‹string›_

### getRawKeystore

▸ **getRawKeystore**\(`keystoreName`: string\): _string_

_Overrides_ [_KeystoreBase_]()_._[_getRawKeystore_]()

_Defined in_ [_inmemory-keystore.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/inmemory-keystore.ts#L14)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keystoreName` | string |

**Returns:** _string_

### importPrivateKey

▸ **importPrivateKey**\(`privateKey`: string, `passphrase`: string\): _Promise‹void›_

_Inherited from_ [_KeystoreBase_]()_._[_importPrivateKey_]()

_Defined in_ [_keystore-base.ts:86_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L86)

Encrypts and stores a private key as a new keystore entry

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `privateKey` | string | Private key to encrypted |
| `passphrase` | string | Secret string to encrypt private key |

**Returns:** _Promise‹void›_

### listKeystoreAddresses

▸ **listKeystoreAddresses**\(\): _Promise‹string\[\]›_

_Inherited from_ [_KeystoreBase_]()_._[_listKeystoreAddresses_]()

_Defined in_ [_keystore-base.ts:64_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L64)

Gets a list of all account addresses in the keystore

**Returns:** _Promise‹string\[\]›_

List of account address strings

### persistKeystore

▸ **persistKeystore**\(`keystoreName`: string, `keystore`: string\): _void_

_Overrides_ [_KeystoreBase_]()_._[_persistKeystore_]()

_Defined in_ [_inmemory-keystore.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/inmemory-keystore.ts#L10)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keystoreName` | string |
| `keystore` | string |

**Returns:** _void_

### removeKeystore

▸ **removeKeystore**\(`keystoreName`: string\): _void_

_Overrides_ [_KeystoreBase_]()_._[_removeKeystore_]()

_Defined in_ [_inmemory-keystore.ts:22_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/inmemory-keystore.ts#L22)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keystoreName` | string |

**Returns:** _void_

