[@celo/identity](../README.md) › ["offchain/utils"](_offchain_utils_.md)

# Module: "offchain/utils"

## Index

### Functions

* [buildEIP712TypedData](_offchain_utils_.md#const-buildeip712typeddata)
* [deserialize](_offchain_utils_.md#const-deserialize)
* [readEncrypted](_offchain_utils_.md#const-readencrypted)
* [resolvePath](_offchain_utils_.md#resolvepath)
* [signBuffer](_offchain_utils_.md#const-signbuffer)
* [writeEncrypted](_offchain_utils_.md#const-writeencrypted)
* [writeSymmetricKeys](_offchain_utils_.md#const-writesymmetrickeys)

## Functions

### `Const` buildEIP712TypedData

▸ **buildEIP712TypedData**<**DataType**>(`wrapper`: [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md), `path`: string, `data`: DataType | Buffer, `type?`: t.Type‹DataType›): *Promise‹EIP712TypedData›*

*Defined in [packages/sdk/identity/src/offchain/utils.ts:296](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/utils.ts#L296)*

**Type parameters:**

▪ **DataType**

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md) |
`path` | string |
`data` | DataType &#124; Buffer |
`type?` | t.Type‹DataType› |

**Returns:** *Promise‹EIP712TypedData›*

___

### `Const` deserialize

▸ **deserialize**<**DataType**>(`type`: Type‹DataType›, `buf`: Buffer): *Result‹DataType, [SchemaErrors](_offchain_accessors_errors_.md#schemaerrors)›*

*Defined in [packages/sdk/identity/src/offchain/utils.ts:279](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/utils.ts#L279)*

**Type parameters:**

▪ **DataType**

**Parameters:**

Name | Type |
------ | ------ |
`type` | Type‹DataType› |
`buf` | Buffer |

**Returns:** *Result‹DataType, [SchemaErrors](_offchain_accessors_errors_.md#schemaerrors)›*

___

### `Const` readEncrypted

▸ **readEncrypted**(`wrapper`: [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md), `dataPath`: string, `senderAddress`: Address): *Promise‹Result‹Buffer, [SchemaErrors](_offchain_accessors_errors_.md#schemaerrors)››*

*Defined in [packages/sdk/identity/src/offchain/utils.ts:249](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/utils.ts#L249)*

Reads and decrypts a payload that has been encrypted to your data encryption key. Will
resolve the symmetric key used to encrypt the payload.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`wrapper` | [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md) | the offchain data wrapper |
`dataPath` | string | path to where the encrypted data is stored. Used to derive the key location |
`senderAddress` | Address | the address that encrypted this key to you  |

**Returns:** *Promise‹Result‹Buffer, [SchemaErrors](_offchain_accessors_errors_.md#schemaerrors)››*

___

###  resolvePath

▸ **resolvePath**(`base`: string, `path`: string): *string*

*Defined in [packages/sdk/identity/src/offchain/utils.ts:404](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/utils.ts#L404)*

We want users to be able to specify a root + path as their base
storage url, https://example.com/store-under/path, for example. Constructing
a URL doesn't respect these paths if the appended path is absolute, so we ensure
it's not and ensure the base is

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`base` | string | root or base of the domain |
`path` | string | the path to append  |

**Returns:** *string*

___

### `Const` signBuffer

▸ **signBuffer**(`wrapper`: [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md), `dataPath`: string, `buf`: Buffer): *Promise‹string›*

*Defined in [packages/sdk/identity/src/offchain/utils.ts:353](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/utils.ts#L353)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md) |
`dataPath` | string |
`buf` | Buffer |

**Returns:** *Promise‹string›*

___

### `Const` writeEncrypted

▸ **writeEncrypted**(`wrapper`: [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md), `dataPath`: string, `data`: Buffer, `toAddresses`: Address[], `symmetricKey?`: Buffer): *Promise‹[SchemaErrors](_offchain_accessors_errors_.md#schemaerrors) | void›*

*Defined in [packages/sdk/identity/src/offchain/utils.ts:135](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/utils.ts#L135)*

Handles encrypting the data with a symmetric key, then distributing said key to each address
in the `toAddresses` array.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`wrapper` | [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md) | the offchain data wrapper |
`dataPath` | string | path to where the encrypted data is stored. Used to derive the key location |
`data` | Buffer | the data to encrypt |
`toAddresses` | Address[] | the addresses to distribute the symmetric key to |
`symmetricKey?` | Buffer | the symmetric key to use to encrypt the data. One will be found or generated if not provided  |

**Returns:** *Promise‹[SchemaErrors](_offchain_accessors_errors_.md#schemaerrors) | void›*

___

### `Const` writeSymmetricKeys

▸ **writeSymmetricKeys**(`wrapper`: [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md), `dataPath`: string, `toAddresses`: Address[], `symmetricKey?`: Buffer): *Promise‹[SchemaErrors](_offchain_accessors_errors_.md#schemaerrors) | void›*

*Defined in [packages/sdk/identity/src/offchain/utils.ts:171](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/utils.ts#L171)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md) |
`dataPath` | string |
`toAddresses` | Address[] |
`symmetricKey?` | Buffer |

**Returns:** *Promise‹[SchemaErrors](_offchain_accessors_errors_.md#schemaerrors) | void›*
