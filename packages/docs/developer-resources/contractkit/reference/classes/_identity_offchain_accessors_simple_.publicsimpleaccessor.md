# Class: PublicSimpleAccessor <**DataType**>

A generic schema for reading and writing objects to and from storage. Passing
in a type parameter is supported for runtime type safety.

## Type parameters

▪ **DataType**

## Hierarchy

* **PublicSimpleAccessor**

  ↳ [PublicNameAccessor](_identity_offchain_accessors_name_.publicnameaccessor.md)

## Implements

* [PublicAccessor](../interfaces/_identity_offchain_accessors_interfaces_.publicaccessor.md)‹DataType›

## Index

### Constructors

* [constructor](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#constructor)

### Properties

* [dataPath](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#datapath)
* [read](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#read)
* [type](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#type)
* [wrapper](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#wrapper)

### Methods

* [readAsResult](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#readasresult)
* [write](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#write)

## Constructors

###  constructor

\+ **new PublicSimpleAccessor**(`wrapper`: [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹DataType›, `dataPath`: string): *[PublicSimpleAccessor](_identity_offchain_accessors_simple_.publicsimpleaccessor.md)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
`type` | Type‹DataType› |
`dataPath` | string |

**Returns:** *[PublicSimpleAccessor](_identity_offchain_accessors_simple_.publicsimpleaccessor.md)*

## Properties

###  dataPath

• **dataPath**: *string*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L21)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PublicAccessor](../interfaces/_identity_offchain_accessors_interfaces_.publicaccessor.md).[read](../interfaces/_identity_offchain_accessors_interfaces_.publicaccessor.md#read)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L61)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

###  type

• **type**: *Type‹DataType›*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L20)*

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L19)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: [Address](../modules/_base_.md#address)): *Promise‹Result‹DataType, [SchemaErrors](../modules/_identity_offchain_accessors_errors_.md#schemaerrors)››*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹Result‹DataType, [SchemaErrors](../modules/_identity_offchain_accessors_errors_.md#schemaerrors)››*

___

###  write

▸ **write**(`data`: DataType): *Promise‹undefined | [InvalidDataError](_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹››*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | DataType |

**Returns:** *Promise‹undefined | [InvalidDataError](_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹››*
