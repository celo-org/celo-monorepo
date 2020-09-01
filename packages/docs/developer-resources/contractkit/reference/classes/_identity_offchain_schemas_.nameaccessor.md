# Class: NameAccessor

## Hierarchy

* [SingleSchema](_identity_offchain_schema_utils_.singleschema.md)‹[NameType](../modules/_identity_offchain_schemas_.md#nametype)›

  ↳ **NameAccessor**

## Index

### Constructors

* [constructor](_identity_offchain_schemas_.nameaccessor.md#constructor)

### Properties

* [dataPath](_identity_offchain_schemas_.nameaccessor.md#datapath)
* [read](_identity_offchain_schemas_.nameaccessor.md#read)
* [type](_identity_offchain_schemas_.nameaccessor.md#type)
* [wrapper](_identity_offchain_schemas_.nameaccessor.md#wrapper)

### Methods

* [readAsResult](_identity_offchain_schemas_.nameaccessor.md#readasresult)
* [write](_identity_offchain_schemas_.nameaccessor.md#write)

## Constructors

###  constructor

\+ **new NameAccessor**(`wrapper`: [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)): *[NameAccessor](_identity_offchain_schemas_.nameaccessor.md)*

*Overrides [SingleSchema](_identity_offchain_schema_utils_.singleschema.md).[constructor](_identity_offchain_schema_utils_.singleschema.md#constructor)*

*Defined in [packages/contractkit/src/identity/offchain/schemas.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schemas.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** *[NameAccessor](_identity_offchain_schemas_.nameaccessor.md)*

## Properties

###  dataPath

• **dataPath**: *string*

*Inherited from [SingleSchema](_identity_offchain_schema_utils_.singleschema.md).[dataPath](_identity_offchain_schema_utils_.singleschema.md#datapath)*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L30)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Inherited from [SingleSchema](_identity_offchain_schema_utils_.singleschema.md).[read](_identity_offchain_schema_utils_.singleschema.md#read)*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L37)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

###  type

• **type**: *Type‹[NameType](../modules/_identity_offchain_schemas_.md#nametype)›*

*Inherited from [SingleSchema](_identity_offchain_schema_utils_.singleschema.md).[type](_identity_offchain_schema_utils_.singleschema.md#type)*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L29)*

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Overrides [SingleSchema](_identity_offchain_schema_utils_.singleschema.md).[wrapper](_identity_offchain_schema_utils_.singleschema.md#wrapper)*

*Defined in [packages/contractkit/src/identity/offchain/schemas.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schemas.ts#L15)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: string): *Promise‹ErrorResult‹[InvalidDataError](_identity_offchain_schema_utils_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_schema_utils_.offchainerror.md)‹›› | OkResult‹T››*

*Inherited from [SingleSchema](_identity_offchain_schema_utils_.singleschema.md).[readAsResult](_identity_offchain_schema_utils_.singleschema.md#readasresult)*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

**Returns:** *Promise‹ErrorResult‹[InvalidDataError](_identity_offchain_schema_utils_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_schema_utils_.offchainerror.md)‹›› | OkResult‹T››*

___

###  write

▸ **write**(`data`: [NameType](../modules/_identity_offchain_schemas_.md#nametype)): *Promise‹void›*

*Inherited from [SingleSchema](_identity_offchain_schema_utils_.singleschema.md).[write](_identity_offchain_schema_utils_.singleschema.md#write)*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [NameType](../modules/_identity_offchain_schemas_.md#nametype) |

**Returns:** *Promise‹void›*
