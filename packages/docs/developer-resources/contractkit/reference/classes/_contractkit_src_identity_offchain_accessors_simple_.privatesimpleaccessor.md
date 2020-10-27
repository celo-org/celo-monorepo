# Class: PrivateSimpleAccessor <**DataType**>

A generic schema for writing and reading encrypted objects to and from storage. Passing
in a type parameter is supported for runtime type safety.

## Type parameters

▪ **DataType**

## Hierarchy

* **PrivateSimpleAccessor**

  ↳ [PrivateNameAccessor](_contractkit_src_identity_offchain_accessors_name_.privatenameaccessor.md)

## Implements

* [PrivateAccessor](../interfaces/_contractkit_src_identity_offchain_accessors_interfaces_.privateaccessor.md)‹DataType›

## Index

### Constructors

* [constructor](_contractkit_src_identity_offchain_accessors_simple_.privatesimpleaccessor.md#constructor)

### Properties

* [dataPath](_contractkit_src_identity_offchain_accessors_simple_.privatesimpleaccessor.md#datapath)
* [read](_contractkit_src_identity_offchain_accessors_simple_.privatesimpleaccessor.md#read)
* [type](_contractkit_src_identity_offchain_accessors_simple_.privatesimpleaccessor.md#type)
* [wrapper](_contractkit_src_identity_offchain_accessors_simple_.privatesimpleaccessor.md#wrapper)

### Methods

* [readAsResult](_contractkit_src_identity_offchain_accessors_simple_.privatesimpleaccessor.md#readasresult)
* [write](_contractkit_src_identity_offchain_accessors_simple_.privatesimpleaccessor.md#write)

## Constructors

###  constructor

\+ **new PrivateSimpleAccessor**(`wrapper`: [OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹DataType›, `dataPath`: string): *[PrivateSimpleAccessor](_contractkit_src_identity_offchain_accessors_simple_.privatesimpleaccessor.md)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L68)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
`type` | Type‹DataType› |
`dataPath` | string |

**Returns:** *[PrivateSimpleAccessor](_contractkit_src_identity_offchain_accessors_simple_.privatesimpleaccessor.md)*

## Properties

###  dataPath

• **dataPath**: *string*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L72)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PrivateAccessor](../interfaces/_contractkit_src_identity_offchain_accessors_interfaces_.privateaccessor.md).[read](../interfaces/_contractkit_src_identity_offchain_accessors_interfaces_.privateaccessor.md#read)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L93)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

###  type

• **type**: *Type‹DataType›*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L71)*

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L70)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[Result](../modules/_base_src_result_.md#result)‹DataType, [SchemaErrors](../modules/_contractkit_src_identity_offchain_accessors_errors_.md#schemaerrors)››*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹[Result](../modules/_base_src_result_.md#result)‹DataType, [SchemaErrors](../modules/_contractkit_src_identity_offchain_accessors_errors_.md#schemaerrors)››*

___

###  write

▸ **write**(`data`: DataType, `toAddresses`: [Address](../modules/_contractkit_src_base_.md#address)[], `symmetricKey?`: Buffer): *Promise‹void | [InvalidDataError](_contractkit_src_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_contractkit_src_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_contractkit_src_identity_offchain_accessors_errors_.invalidkey.md)‹››*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | DataType |
`toAddresses` | [Address](../modules/_contractkit_src_base_.md#address)[] |
`symmetricKey?` | Buffer |

**Returns:** *Promise‹void | [InvalidDataError](_contractkit_src_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_contractkit_src_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_contractkit_src_identity_offchain_accessors_errors_.invalidkey.md)‹››*
