# Class: PrivateNameAccessor

## Hierarchy

* [PrivateSimpleAccessor](_identity_offchain_accessors_simple_.privatesimpleaccessor.md)‹[NameType](../modules/_identity_offchain_accessors_name_.md#nametype)›

  ↳ **PrivateNameAccessor**

## Implements

* [PrivateAccessor](../interfaces/_identity_offchain_accessors_interfaces_.privateaccessor.md)‹[NameType](../modules/_identity_offchain_accessors_name_.md#nametype)›

## Index

### Constructors

* [constructor](_identity_offchain_accessors_name_.privatenameaccessor.md#constructor)

### Properties

* [dataPath](_identity_offchain_accessors_name_.privatenameaccessor.md#datapath)
* [read](_identity_offchain_accessors_name_.privatenameaccessor.md#read)
* [type](_identity_offchain_accessors_name_.privatenameaccessor.md#type)
* [wrapper](_identity_offchain_accessors_name_.privatenameaccessor.md#wrapper)

### Methods

* [readAsResult](_identity_offchain_accessors_name_.privatenameaccessor.md#readasresult)
* [write](_identity_offchain_accessors_name_.privatenameaccessor.md#write)

## Constructors

###  constructor

\+ **new PrivateNameAccessor**(`wrapper`: [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)): *[PrivateNameAccessor](_identity_offchain_accessors_name_.privatenameaccessor.md)*

*Overrides [PrivateSimpleAccessor](_identity_offchain_accessors_simple_.privatesimpleaccessor.md).[constructor](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#constructor)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/name.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/name.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** *[PrivateNameAccessor](_identity_offchain_accessors_name_.privatenameaccessor.md)*

## Properties

###  dataPath

• **dataPath**: *string*

*Inherited from [PrivateSimpleAccessor](_identity_offchain_accessors_simple_.privatesimpleaccessor.md).[dataPath](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#datapath)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L72)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PrivateAccessor](../interfaces/_identity_offchain_accessors_interfaces_.privateaccessor.md).[read](../interfaces/_identity_offchain_accessors_interfaces_.privateaccessor.md#read)*

*Inherited from [PrivateSimpleAccessor](_identity_offchain_accessors_simple_.privatesimpleaccessor.md).[read](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#read)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L93)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

###  type

• **type**: *Type‹[NameType](../modules/_identity_offchain_accessors_name_.md#nametype)›*

*Inherited from [PrivateSimpleAccessor](_identity_offchain_accessors_simple_.privatesimpleaccessor.md).[type](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#type)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L71)*

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Overrides [PrivateSimpleAccessor](_identity_offchain_accessors_simple_.privatesimpleaccessor.md).[wrapper](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#wrapper)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/name.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/name.ts#L18)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: [Address](../modules/_base_.md#address)): *Promise‹Result‹[NameType](../modules/_identity_offchain_accessors_name_.md#nametype), [SchemaErrors](../modules/_identity_offchain_accessors_errors_.md#schemaerrors)››*

*Inherited from [PrivateSimpleAccessor](_identity_offchain_accessors_simple_.privatesimpleaccessor.md).[readAsResult](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#readasresult)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹Result‹[NameType](../modules/_identity_offchain_accessors_name_.md#nametype), [SchemaErrors](../modules/_identity_offchain_accessors_errors_.md#schemaerrors)››*

___

###  write

▸ **write**(`data`: [NameType](../modules/_identity_offchain_accessors_name_.md#nametype), `toAddresses`: [Address](../modules/_base_.md#address)[], `symmetricKey?`: Buffer): *Promise‹void | [InvalidDataError](_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_identity_offchain_accessors_errors_.invalidkey.md)‹››*

*Inherited from [PrivateSimpleAccessor](_identity_offchain_accessors_simple_.privatesimpleaccessor.md).[write](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#write)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [NameType](../modules/_identity_offchain_accessors_name_.md#nametype) |
`toAddresses` | [Address](../modules/_base_.md#address)[] |
`symmetricKey?` | Buffer |

**Returns:** *Promise‹void | [InvalidDataError](_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_identity_offchain_accessors_errors_.invalidkey.md)‹››*
