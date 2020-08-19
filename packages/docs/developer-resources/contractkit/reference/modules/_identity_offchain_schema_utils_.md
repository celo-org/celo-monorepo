# External module: "identity/offchain/schema-utils"

## Index

### Enumerations

* [SchemaErrorTypes](../enums/_identity_offchain_schema_utils_.schemaerrortypes.md)

### Classes

* [InvalidDataError](../classes/_identity_offchain_schema_utils_.invaliddataerror.md)
* [OffchainError](../classes/_identity_offchain_schema_utils_.offchainerror.md)
* [SingleSchema](../classes/_identity_offchain_schema_utils_.singleschema.md)

### Variables

* [readWithSchema](_identity_offchain_schema_utils_.md#const-readwithschema)

### Functions

* [readWithSchemaAsResult](_identity_offchain_schema_utils_.md#const-readwithschemaasresult)
* [writeWithSchema](_identity_offchain_schema_utils_.md#const-writewithschema)

## Variables

### `Const` readWithSchema

• **readWithSchema**: *Object* = makeAsyncThrowable(readWithSchemaAsResult)

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L68)*

## Functions

### `Const` readWithSchemaAsResult

▸ **readWithSchemaAsResult**<**T**>(`wrapper`: [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹T›, `account`: [Address](_base_.md#address), `dataPath`: string): *Promise‹Result‹T, SchemaErrors››*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L44)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
`type` | Type‹T› |
`account` | [Address](_base_.md#address) |
`dataPath` | string |

**Returns:** *Promise‹Result‹T, SchemaErrors››*

___

### `Const` writeWithSchema

▸ **writeWithSchema**<**T**>(`wrapper`: [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹T›, `dataPath`: string, `data`: T): *Promise‹void›*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L70)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
`type` | Type‹T› |
`dataPath` | string |
`data` | T |

**Returns:** *Promise‹void›*
