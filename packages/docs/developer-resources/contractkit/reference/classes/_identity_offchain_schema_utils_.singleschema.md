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

*Defined in [contractkit/src/identity/offchain/schema-utils.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L6)*

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

*Defined in [contractkit/src/identity/offchain/schema-utils.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L10)*

___

###  type

• **type**: *Type‹T›*

*Defined in [contractkit/src/identity/offchain/schema-utils.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L9)*

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [contractkit/src/identity/offchain/schema-utils.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L8)*

## Methods

###  read

▸ **read**(`account`: string): *Promise‹undefined | T›*

*Defined in [contractkit/src/identity/offchain/schema-utils.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

**Returns:** *Promise‹undefined | T›*

___

###  write

▸ **write**(`data`: T): *Promise‹void›*

*Defined in [contractkit/src/identity/offchain/schema-utils.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | T |

**Returns:** *Promise‹void›*
