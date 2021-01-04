# Class: PublicSimpleAccessor <**DataType**>

A generic schema for reading and writing objects to and from storage. Passing
in a type parameter is supported for runtime type safety.

## Type parameters

▪ **DataType**

## Hierarchy

* **PublicSimpleAccessor**

  ↳ [PublicNameAccessor](_offchain_accessors_name_.publicnameaccessor.md)

## Implements

* [PublicAccessor](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md)‹DataType›

## Index

### Constructors

* [constructor](_offchain_accessors_simple_.publicsimpleaccessor.md#constructor)

### Properties

* [dataPath](_offchain_accessors_simple_.publicsimpleaccessor.md#readonly-datapath)
* [read](_offchain_accessors_simple_.publicsimpleaccessor.md#read)
* [type](_offchain_accessors_simple_.publicsimpleaccessor.md#readonly-type)
* [wrapper](_offchain_accessors_simple_.publicsimpleaccessor.md#readonly-wrapper)

### Methods

* [readAsResult](_offchain_accessors_simple_.publicsimpleaccessor.md#readasresult)
* [write](_offchain_accessors_simple_.publicsimpleaccessor.md#write)

## Constructors

###  constructor

\+ **new PublicSimpleAccessor**(`wrapper`: [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹DataType›, `dataPath`: string): *[PublicSimpleAccessor](_offchain_accessors_simple_.publicsimpleaccessor.md)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md) |
`type` | Type‹DataType› |
`dataPath` | string |

**Returns:** *[PublicSimpleAccessor](_offchain_accessors_simple_.publicsimpleaccessor.md)*

## Properties

### `Readonly` dataPath

• **dataPath**: *string*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L21)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PublicAccessor](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md).[read](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md#read)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L61)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

### `Readonly` type

• **type**: *Type‹DataType›*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L20)*

___

### `Readonly` wrapper

• **wrapper**: *[OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L19)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: Address): *Promise‹Result‹DataType, [SchemaErrors](../modules/_offchain_accessors_errors_.md#schemaerrors)››*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |

**Returns:** *Promise‹Result‹DataType, [SchemaErrors](../modules/_offchain_accessors_errors_.md#schemaerrors)››*

___

###  write

▸ **write**(`data`: DataType): *Promise‹undefined | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹››*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | DataType |

**Returns:** *Promise‹undefined | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹››*
