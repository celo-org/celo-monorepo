# KeystoreBase

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

### changeKeystorePassphrase

▸ **changeKeystorePassphrase**\(`address`: string, `oldPassphrase`: string, `newPassphrase`: string\): _Promise‹void›_

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

_Defined in_ [_keystore-base.ts:145_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L145)

Permanently removes keystore entry from keystore

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | string | Account address of keystore to be deleted |

**Returns:** _Promise‹void›_

### getAddress

▸ **getAddress**\(`keystoreName`: string\): _string_

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

_Defined in_ [_keystore-base.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L72)

Maps account addresses to their respective keystore entries \(names\)

**Returns:** _Promise‹Record‹string, string››_

Record with account addresses as keys, keystore entry names as values

### `Abstract` getAllKeystoreNames

▸ **getAllKeystoreNames**\(\): _Promise‹string\[\]›_

_Defined in_ [_keystore-base.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L38)

Gets a list of the names of each entry in the keystore

**Returns:** _Promise‹string\[\]›_

### getKeystoreName

▸ **getKeystoreName**\(`address`: string\): _Promise‹string›_

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

_Defined in_ [_keystore-base.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L120)

Gets decrypted \(plaintext\) private key for an account address

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | string | Account address |
| `passphrase` | string | Secret phrase used to encrypt the private key |

**Returns:** _Promise‹string›_

### `Abstract` getRawKeystore

▸ **getRawKeystore**\(`keystoreName`: string\): _string_

_Defined in_ [_keystore-base.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L33)

Returns raw encrypted keystore entry string by name

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `keystoreName` | string | Name of keystore entry to retrieve |

**Returns:** _string_

### importPrivateKey

▸ **importPrivateKey**\(`privateKey`: string, `passphrase`: string\): _Promise‹void›_

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

_Defined in_ [_keystore-base.ts:64_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L64)

Gets a list of all account addresses in the keystore

**Returns:** _Promise‹string\[\]›_

List of account address strings

### `Abstract` persistKeystore

▸ **persistKeystore**\(`keystoreName`: string, `keystore`: string\): _void_

_Defined in_ [_keystore-base.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L27)

Saves encrypted keystore entry \(i.e. to disk, database, ...\). Must be implemented by subclass.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `keystoreName` | string | Name of keystore entry to be saved |
| `keystore` | string | encrypted V3Keystore string entry |

**Returns:** _void_

### `Abstract` removeKeystore

▸ **removeKeystore**\(`keystoreName`: string\): _void_

_Defined in_ [_keystore-base.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-base.ts#L44)

Removes keystore entry from keystore permanently

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `keystoreName` | string | Name of keystore entry to remove |

**Returns:** _void_

