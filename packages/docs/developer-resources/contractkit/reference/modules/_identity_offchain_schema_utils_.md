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

### Functions

* [readWithSchema](_identity_offchain_schema_utils_.md#const-readwithschema)
* [writeWithSchema](_identity_offchain_schema_utils_.md#const-writewithschema)

## Functions

### `Const` readWithSchema

▸ **readWithSchema**<**T**>(`wrapper`: [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹T›, `account`: [Address](_base_.md#address), `dataPath`: string): *Promise‹[Task](_identity_task_.md#task)‹T, SchemaErrors››*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L56)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
`type` | Type‹T› |
`account` | [Address](_base_.md#address) |
`dataPath` | string |

**Returns:** *Promise‹[Task](_identity_task_.md#task)‹T, SchemaErrors››*

___

### `Const` writeWithSchema

▸ **writeWithSchema**<**T**>(`wrapper`: [OffchainDataWrapper](../classes/_identity_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹T›, `dataPath`: string, `data`: T): *Promise‹void›*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L80)*

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
