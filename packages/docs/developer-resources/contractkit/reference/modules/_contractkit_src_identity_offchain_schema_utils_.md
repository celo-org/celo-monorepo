# External module: "contractkit/src/identity/offchain/schema-utils"

## Index

### Classes

* [SingleSchema](../classes/_contractkit_src_identity_offchain_schema_utils_.singleschema.md)

### Functions

* [readWithSchema](_contractkit_src_identity_offchain_schema_utils_.md#const-readwithschema)
* [writeWithSchema](_contractkit_src_identity_offchain_schema_utils_.md#const-writewithschema)

## Functions

### `Const` readWithSchema

▸ **readWithSchema**<**T**>(`wrapper`: [OffchainDataWrapper](../classes/_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹T›, `account`: [Address](_contractkit_src_base_.md#address), `dataPath`: string): *Promise‹undefined | T›*

*Defined in [contractkit/src/identity/offchain/schema-utils.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L22)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](../classes/_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
`type` | Type‹T› |
`account` | [Address](_contractkit_src_base_.md#address) |
`dataPath` | string |

**Returns:** *Promise‹undefined | T›*

___

### `Const` writeWithSchema

▸ **writeWithSchema**<**T**>(`wrapper`: [OffchainDataWrapper](../classes/_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹T›, `dataPath`: string, `data`: T): *Promise‹void›*

*Defined in [contractkit/src/identity/offchain/schema-utils.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L41)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](../classes/_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
`type` | Type‹T› |
`dataPath` | string |
`data` | T |

**Returns:** *Promise‹void›*
