# External module: "identity/offchain/schema-utils"

## Index

### Enumerations

* [SchemaErrorTypes](../enums/_identity_offchain_schema_utils_.schemaerrortypes.md)

### Classes

* [OffchainError](../classes/_identity_offchain_schema_utils_.offchainerror.md)
* [SingleSchema](../classes/_identity_offchain_schema_utils_.singleschema.md)

### Interfaces

* [IOffchainError](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md)
* [InvalidDataError](../interfaces/_identity_offchain_schema_utils_.invaliddataerror.md)

### Variables

* [readWithSchema](_identity_offchain_schema_utils_.md#const-readwithschema)

### Functions

* [readWithSchemaAsResult](_identity_offchain_schema_utils_.md#const-readwithschemaasresult)
* [writeWithSchema](_identity_offchain_schema_utils_.md#const-writewithschema)

## Variables

### `Const` readWithSchema

• **readWithSchema**: *Object* = makeAsyncThrowable(readWithSchemaAsResult)

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L71)*

## Functions

### `Const` readWithSchemaAsResult

▸ **readWithSchemaAsResult**<**T**>(`wrapper`: [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹T›, `account`: [Address](_base_.md#address), `dataPath`: string): *Promise‹Result‹T, SchemaErrors››*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L47)*

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

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L73)*

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
