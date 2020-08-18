# Class: SingleSchema <**T**>

## Type parameters

▪ **T**

## Hierarchy

* **SingleSchema**

  ↳ [NameAccessor](_identity_offchain_schemas_.nameaccessor.md)

## Index

### Constructors

* [constructor](_identity_offchain_schema_utils_.singleschema.md#constructor)

### Properties

* [dataPath](_identity_offchain_schema_utils_.singleschema.md#datapath)
* [type](_identity_offchain_schema_utils_.singleschema.md#type)
* [wrapper](_identity_offchain_schema_utils_.singleschema.md#wrapper)

### Methods

* [read](_identity_offchain_schema_utils_.singleschema.md#read)
* [write](_identity_offchain_schema_utils_.singleschema.md#write)

## Constructors

###  constructor

\+ **new SingleSchema**(`wrapper`: [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹T›, `dataPath`: string): *[SingleSchema](_identity_offchain_schema_utils_.singleschema.md)*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
`type` | Type‹T› |
`dataPath` | string |

**Returns:** *[SingleSchema](_identity_offchain_schema_utils_.singleschema.md)*

## Properties

###  dataPath

• **dataPath**: *string*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L33)*

___

###  type

• **type**: *Type‹T›*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L32)*

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L31)*

## Methods

###  read

▸ **read**(`account`: string): *Promise‹[FailedTask](../interfaces/_identity_task_.failedtask.md)‹[IOffchainError](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md) | [InvalidDataError](../interfaces/_identity_offchain_schema_utils_.invaliddataerror.md)› | [OKTask](../interfaces/_identity_task_.oktask.md)‹T››*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

**Returns:** *Promise‹[FailedTask](../interfaces/_identity_task_.failedtask.md)‹[IOffchainError](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md) | [InvalidDataError](../interfaces/_identity_offchain_schema_utils_.invaliddataerror.md)› | [OKTask](../interfaces/_identity_task_.oktask.md)‹T››*

___

###  write

▸ **write**(`data`: T): *Promise‹void›*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | T |

**Returns:** *Promise‹void›*
