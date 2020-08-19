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
* [read](_identity_offchain_schema_utils_.singleschema.md#read)
* [type](_identity_offchain_schema_utils_.singleschema.md#type)
* [wrapper](_identity_offchain_schema_utils_.singleschema.md#wrapper)

### Methods

* [readAsResult](_identity_offchain_schema_utils_.singleschema.md#readasresult)
* [write](_identity_offchain_schema_utils_.singleschema.md#write)

## Constructors

###  constructor

\+ **new SingleSchema**(`wrapper`: [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹T›, `dataPath`: string): *[SingleSchema](_identity_offchain_schema_utils_.singleschema.md)*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L26)*

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

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L30)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L37)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

###  type

• **type**: *Type‹T›*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L29)*

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L28)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: string): *Promise‹ErrorResult‹[InvalidDataError](_identity_offchain_schema_utils_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_schema_utils_.offchainerror.md)‹›› | OkResult‹T››*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

**Returns:** *Promise‹ErrorResult‹[InvalidDataError](_identity_offchain_schema_utils_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_schema_utils_.offchainerror.md)‹›› | OkResult‹T››*

___

###  write

▸ **write**(`data`: T): *Promise‹void›*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | T |

**Returns:** *Promise‹void›*
