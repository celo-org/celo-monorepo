# Class: PublicNameAccessor

## Hierarchy

* [PublicSimpleAccessor](_identity_offchain_accessors_simple_.publicsimpleaccessor.md)‹[NameType](../modules/_identity_offchain_accessors_name_.md#nametype)›

  ↳ **PublicNameAccessor**

## Implements

* [PublicAccessor](../interfaces/_identity_offchain_accessors_interfaces_.publicaccessor.md)‹[NameType](../modules/_identity_offchain_accessors_name_.md#nametype)›

## Index

### Constructors

* [constructor](_identity_offchain_accessors_name_.publicnameaccessor.md#constructor)

### Properties

* [dataPath](_identity_offchain_accessors_name_.publicnameaccessor.md#datapath)
* [read](_identity_offchain_accessors_name_.publicnameaccessor.md#read)
* [type](_identity_offchain_accessors_name_.publicnameaccessor.md#type)
* [wrapper](_identity_offchain_accessors_name_.publicnameaccessor.md#wrapper)

### Methods

* [readAsResult](_identity_offchain_accessors_name_.publicnameaccessor.md#readasresult)
* [write](_identity_offchain_accessors_name_.publicnameaccessor.md#write)

## Constructors

###  constructor

\+ **new PublicNameAccessor**(`wrapper`: [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)): *[PublicNameAccessor](_identity_offchain_accessors_name_.publicnameaccessor.md)*

*Overrides [PublicSimpleAccessor](_identity_offchain_accessors_simple_.publicsimpleaccessor.md).[constructor](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#constructor)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/name.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/name.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** *[PublicNameAccessor](_identity_offchain_accessors_name_.publicnameaccessor.md)*

## Properties

###  dataPath

• **dataPath**: *string*

*Inherited from [PublicSimpleAccessor](_identity_offchain_accessors_simple_.publicsimpleaccessor.md).[dataPath](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#datapath)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L21)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PublicAccessor](../interfaces/_identity_offchain_accessors_interfaces_.publicaccessor.md).[read](../interfaces/_identity_offchain_accessors_interfaces_.publicaccessor.md#read)*

*Inherited from [PublicSimpleAccessor](_identity_offchain_accessors_simple_.publicsimpleaccessor.md).[read](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#read)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L61)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

###  type

• **type**: *Type‹[NameType](../modules/_identity_offchain_accessors_name_.md#nametype)›*

*Inherited from [PublicSimpleAccessor](_identity_offchain_accessors_simple_.publicsimpleaccessor.md).[type](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#type)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L20)*

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Overrides [PublicSimpleAccessor](_identity_offchain_accessors_simple_.publicsimpleaccessor.md).[wrapper](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#wrapper)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/name.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/name.ts#L12)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: [Address](../modules/_base_.md#address)): *Promise‹Result‹[NameType](../modules/_identity_offchain_accessors_name_.md#nametype), [SchemaErrors](../modules/_identity_offchain_accessors_errors_.md#schemaerrors)››*

*Inherited from [PublicSimpleAccessor](_identity_offchain_accessors_simple_.publicsimpleaccessor.md).[readAsResult](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#readasresult)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹Result‹[NameType](../modules/_identity_offchain_accessors_name_.md#nametype), [SchemaErrors](../modules/_identity_offchain_accessors_errors_.md#schemaerrors)››*

___

###  write

▸ **write**(`data`: [NameType](../modules/_identity_offchain_accessors_name_.md#nametype)): *Promise‹undefined | [InvalidDataError](_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹››*

*Inherited from [PublicSimpleAccessor](_identity_offchain_accessors_simple_.publicsimpleaccessor.md).[write](_identity_offchain_accessors_simple_.publicsimpleaccessor.md#write)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/simple.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [NameType](../modules/_identity_offchain_accessors_name_.md#nametype) |

**Returns:** *Promise‹undefined | [InvalidDataError](_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹››*
