# External module: "identity/offchain/utils"

## Index

### Functions

* [buildEIP712TypedData](_identity_offchain_utils_.md#const-buildeip712typeddata)
* [deserialize](_identity_offchain_utils_.md#const-deserialize)
* [readEncrypted](_identity_offchain_utils_.md#const-readencrypted)
* [resolvePath](_identity_offchain_utils_.md#resolvepath)
* [signBuffer](_identity_offchain_utils_.md#const-signbuffer)
* [writeEncrypted](_identity_offchain_utils_.md#const-writeencrypted)

## Functions

### `Const` buildEIP712TypedData

▸ **buildEIP712TypedData**<**DataType**>(`wrapper`: [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md), `path`: string, `data`: DataType | Buffer, `type?`: t.Type‹DataType›): *Promise‹EIP712TypedData›*

*Defined in [packages/contractkit/src/identity/offchain/utils.ts:274](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/utils.ts#L274)*

**Type parameters:**

▪ **DataType**

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
`path` | string |
`data` | DataType &#124; Buffer |
`type?` | t.Type‹DataType› |

**Returns:** *Promise‹EIP712TypedData›*

___

### `Const` deserialize

▸ **deserialize**<**DataType**>(`type`: Type‹DataType›, `buf`: Buffer): *Result‹DataType, [SchemaErrors](_identity_offchain_accessors_errors_.md#schemaerrors)›*

*Defined in [packages/contractkit/src/identity/offchain/utils.ts:257](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/utils.ts#L257)*

**Type parameters:**

▪ **DataType**

**Parameters:**

Name | Type |
------ | ------ |
`type` | Type‹DataType› |
`buf` | Buffer |

**Returns:** *Result‹DataType, [SchemaErrors](_identity_offchain_accessors_errors_.md#schemaerrors)›*

___

### `Const` readEncrypted

▸ **readEncrypted**(`wrapper`: [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md), `dataPath`: string, `senderAddress`: [Address](_base_.md#address)): *Promise‹Result‹Buffer, [SchemaErrors](_identity_offchain_accessors_errors_.md#schemaerrors)››*

*Defined in [packages/contractkit/src/identity/offchain/utils.ts:227](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/utils.ts#L227)*

Reads and decrypts a payload that has been encrypted to your data encryption key. Will
resolve the symmetric key used to encrypt the payload.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`wrapper` | [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md) | the offchain data wrapper |
`dataPath` | string | path to where the encrypted data is stored. Used to derive the key location |
`senderAddress` | [Address](_base_.md#address) | the address that encrypted this key to you  |

**Returns:** *Promise‹Result‹Buffer, [SchemaErrors](_identity_offchain_accessors_errors_.md#schemaerrors)››*

___

###  resolvePath

▸ **resolvePath**(`base`: string, `path`: string): *string*

*Defined in [packages/contractkit/src/identity/offchain/utils.ts:382](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/utils.ts#L382)*

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

▸ **signBuffer**(`wrapper`: [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md), `dataPath`: string, `buf`: Buffer): *Promise‹string›*

*Defined in [packages/contractkit/src/identity/offchain/utils.ts:331](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/utils.ts#L331)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
`dataPath` | string |
`buf` | Buffer |

**Returns:** *Promise‹string›*

___

### `Const` writeEncrypted

▸ **writeEncrypted**(`wrapper`: [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md), `dataPath`: string, `data`: Buffer, `toAddresses`: [Address](_base_.md#address)[], `symmetricKey?`: Buffer): *Promise‹[SchemaErrors](_identity_offchain_accessors_errors_.md#schemaerrors) | void›*

*Defined in [packages/contractkit/src/identity/offchain/utils.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/utils.ts#L134)*

Handles encrypting the data with a symmetric key, then distributing said key to each address
in the `toAddresses` array.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`wrapper` | [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md) | the offchain data wrapper |
`dataPath` | string | path to where the encrypted data is stored. Used to derive the key location |
`data` | Buffer | the data to encrypt |
`toAddresses` | [Address](_base_.md#address)[] | the addresses to distribute the symmetric key to |
`symmetricKey?` | Buffer | the symmetric key to use to encrypt the data. One will be found or generated if not provided  |

**Returns:** *Promise‹[SchemaErrors](_identity_offchain_accessors_errors_.md#schemaerrors) | void›*
