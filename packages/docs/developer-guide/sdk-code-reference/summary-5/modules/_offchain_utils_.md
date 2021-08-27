# offchain/utils

## Index

### Functions

* [buildEIP712TypedData](_offchain_utils_.md#const-buildeip712typeddata)
* [deserialize](_offchain_utils_.md#const-deserialize)
* [readEncrypted](_offchain_utils_.md#const-readencrypted)
* [resolvePath](_offchain_utils_.md#resolvepath)
* [signBuffer](_offchain_utils_.md#const-signbuffer)
* [writeEncrypted](_offchain_utils_.md#const-writeencrypted)

## Functions

### `Const` buildEIP712TypedData

▸ **buildEIP712TypedData**&lt;**DataType**&gt;\(`wrapper`: [OffchainDataWrapper](), `path`: string, `data`: DataType \| Buffer, `type?`: t.Type‹DataType›\): _Promise‹EIP712TypedData›_

_Defined in_ [_packages/sdk/identity/src/offchain/utils.ts:274_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/utils.ts#L274)

**Type parameters:**

▪ **DataType**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper]() |
| `path` | string |
| `data` | DataType \| Buffer |
| `type?` | t.Type‹DataType› |

**Returns:** _Promise‹EIP712TypedData›_

### `Const` deserialize

▸ **deserialize**&lt;**DataType**&gt;\(`type`: Type‹DataType›, `buf`: Buffer\): _Result‹DataType,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_›_

_Defined in_ [_packages/sdk/identity/src/offchain/utils.ts:257_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/utils.ts#L257)

**Type parameters:**

▪ **DataType**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | Type‹DataType› |
| `buf` | Buffer |

**Returns:** _Result‹DataType,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_›_

### `Const` readEncrypted

▸ **readEncrypted**\(`wrapper`: [OffchainDataWrapper](), `dataPath`: string, `senderAddress`: Address\): _Promise‹Result‹Buffer,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

_Defined in_ [_packages/sdk/identity/src/offchain/utils.ts:227_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/utils.ts#L227)

Reads and decrypts a payload that has been encrypted to your data encryption key. Will resolve the symmetric key used to encrypt the payload.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `wrapper` | [OffchainDataWrapper]() | the offchain data wrapper |
| `dataPath` | string | path to where the encrypted data is stored. Used to derive the key location |
| `senderAddress` | Address | the address that encrypted this key to you |

**Returns:** _Promise‹Result‹Buffer,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

### resolvePath

▸ **resolvePath**\(`base`: string, `path`: string\): _string_

_Defined in_ [_packages/sdk/identity/src/offchain/utils.ts:382_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/utils.ts#L382)

We want users to be able to specify a root + path as their base storage url, [https://example.com/store-under/path](https://example.com/store-under/path), for example. Constructing a URL doesn't respect these paths if the appended path is absolute, so we ensure it's not and ensure the base is

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `base` | string | root or base of the domain |
| `path` | string | the path to append |

**Returns:** _string_

### `Const` signBuffer

▸ **signBuffer**\(`wrapper`: [OffchainDataWrapper](), `dataPath`: string, `buf`: Buffer\): _Promise‹string›_

_Defined in_ [_packages/sdk/identity/src/offchain/utils.ts:331_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/utils.ts#L331)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper]() |
| `dataPath` | string |
| `buf` | Buffer |

**Returns:** _Promise‹string›_

### `Const` writeEncrypted

▸ **writeEncrypted**\(`wrapper`: [OffchainDataWrapper](), `dataPath`: string, `data`: Buffer, `toAddresses`: Address\[\], `symmetricKey?`: Buffer\): _Promise‹_[_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors) _\| void›_

_Defined in_ [_packages/sdk/identity/src/offchain/utils.ts:134_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/utils.ts#L134)

Handles encrypting the data with a symmetric key, then distributing said key to each address in the `toAddresses` array.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `wrapper` | [OffchainDataWrapper]() | the offchain data wrapper |
| `dataPath` | string | path to where the encrypted data is stored. Used to derive the key location |
| `data` | Buffer | the data to encrypt |
| `toAddresses` | Address\[\] | the addresses to distribute the symmetric key to |
| `symmetricKey?` | Buffer | the symmetric key to use to encrypt the data. One will be found or generated if not provided |

**Returns:** _Promise‹_[_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors) _\| void›_

