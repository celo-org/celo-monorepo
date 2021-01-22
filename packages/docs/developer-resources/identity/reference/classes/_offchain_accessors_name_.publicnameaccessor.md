# Class: PublicNameAccessor

## Hierarchy

* [PublicSimpleAccessor](_offchain_accessors_simple_.publicsimpleaccessor.md)‹[NameType](../modules/_offchain_accessors_name_.md#nametype)›

  ↳ **PublicNameAccessor**

## Implements

* [PublicAccessor](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md)‹[NameType](../modules/_offchain_accessors_name_.md#nametype)›

## Index

### Constructors

* [constructor](_offchain_accessors_name_.publicnameaccessor.md#constructor)

### Properties

* [dataPath](_offchain_accessors_name_.publicnameaccessor.md#readonly-datapath)
* [read](_offchain_accessors_name_.publicnameaccessor.md#read)
* [type](_offchain_accessors_name_.publicnameaccessor.md#readonly-type)
* [wrapper](_offchain_accessors_name_.publicnameaccessor.md#readonly-wrapper)

### Methods

* [readAsResult](_offchain_accessors_name_.publicnameaccessor.md#readasresult)
* [write](_offchain_accessors_name_.publicnameaccessor.md#write)

## Constructors

###  constructor

\+ **new PublicNameAccessor**(`wrapper`: [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)): *[PublicNameAccessor](_offchain_accessors_name_.publicnameaccessor.md)*

*Overrides [PublicSimpleAccessor](_offchain_accessors_simple_.publicsimpleaccessor.md).[constructor](_offchain_accessors_simple_.publicsimpleaccessor.md#constructor)*

*Defined in [packages/sdk/identity/src/offchain/accessors/name.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/name.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** *[PublicNameAccessor](_offchain_accessors_name_.publicnameaccessor.md)*

## Properties

### `Readonly` dataPath

• **dataPath**: *string*

*Inherited from [PublicSimpleAccessor](_offchain_accessors_simple_.publicsimpleaccessor.md).[dataPath](_offchain_accessors_simple_.publicsimpleaccessor.md#readonly-datapath)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L21)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PublicAccessor](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md).[read](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md#read)*

*Inherited from [PublicSimpleAccessor](_offchain_accessors_simple_.publicsimpleaccessor.md).[read](_offchain_accessors_simple_.publicsimpleaccessor.md#read)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L61)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

### `Readonly` type

• **type**: *Type‹[NameType](../modules/_offchain_accessors_name_.md#nametype)›*

*Inherited from [PublicSimpleAccessor](_offchain_accessors_simple_.publicsimpleaccessor.md).[type](_offchain_accessors_simple_.publicsimpleaccessor.md#readonly-type)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L20)*

___

### `Readonly` wrapper

• **wrapper**: *[OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)*

*Overrides [PublicSimpleAccessor](_offchain_accessors_simple_.publicsimpleaccessor.md).[wrapper](_offchain_accessors_simple_.publicsimpleaccessor.md#readonly-wrapper)*

*Defined in [packages/sdk/identity/src/offchain/accessors/name.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/name.ts#L12)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: Address): *Promise‹Result‹[NameType](../modules/_offchain_accessors_name_.md#nametype), [SchemaErrors](../modules/_offchain_accessors_errors_.md#schemaerrors)››*

*Inherited from [PublicSimpleAccessor](_offchain_accessors_simple_.publicsimpleaccessor.md).[readAsResult](_offchain_accessors_simple_.publicsimpleaccessor.md#readasresult)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |

**Returns:** *Promise‹Result‹[NameType](../modules/_offchain_accessors_name_.md#nametype), [SchemaErrors](../modules/_offchain_accessors_errors_.md#schemaerrors)››*

___

###  write

▸ **write**(`data`: [NameType](../modules/_offchain_accessors_name_.md#nametype)): *Promise‹undefined | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹››*

*Inherited from [PublicSimpleAccessor](_offchain_accessors_simple_.publicsimpleaccessor.md).[write](_offchain_accessors_simple_.publicsimpleaccessor.md#write)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [NameType](../modules/_offchain_accessors_name_.md#nametype) |

**Returns:** *Promise‹undefined | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹››*
