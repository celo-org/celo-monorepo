[@celo/identity](../README.md) › ["offchain/accessors/simple"](../modules/_offchain_accessors_simple_.md) › [PrivateSimpleAccessor](_offchain_accessors_simple_.privatesimpleaccessor.md)

# Class: PrivateSimpleAccessor <**DataType**>

A generic schema for writing and reading encrypted objects to and from storage. Passing
in a type parameter is supported for runtime type safety.

## Type parameters

▪ **DataType**

## Hierarchy

* **PrivateSimpleAccessor**

  ↳ [PrivateNameAccessor](_offchain_accessors_name_.privatenameaccessor.md)

## Implements

* [PrivateAccessor](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md)‹DataType›

## Index

### Constructors

* [constructor](_offchain_accessors_simple_.privatesimpleaccessor.md#constructor)

### Properties

* [dataPath](_offchain_accessors_simple_.privatesimpleaccessor.md#readonly-datapath)
* [read](_offchain_accessors_simple_.privatesimpleaccessor.md#read)
* [type](_offchain_accessors_simple_.privatesimpleaccessor.md#readonly-type)
* [wrapper](_offchain_accessors_simple_.privatesimpleaccessor.md#readonly-wrapper)

### Methods

* [allowAccess](_offchain_accessors_simple_.privatesimpleaccessor.md#allowaccess)
* [readAsResult](_offchain_accessors_simple_.privatesimpleaccessor.md#readasresult)
* [write](_offchain_accessors_simple_.privatesimpleaccessor.md#write)

## Constructors

###  constructor

\+ **new PrivateSimpleAccessor**(`wrapper`: [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹DataType›, `dataPath`: string): *[PrivateSimpleAccessor](_offchain_accessors_simple_.privatesimpleaccessor.md)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md) |
`type` | Type‹DataType› |
`dataPath` | string |

**Returns:** *[PrivateSimpleAccessor](_offchain_accessors_simple_.privatesimpleaccessor.md)*

## Properties

### `Readonly` dataPath

• **dataPath**: *string*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L78)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PrivateAccessor](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md).[read](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md#read)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:103](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L103)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

### `Readonly` type

• **type**: *Type‹DataType›*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L77)*

___

### `Readonly` wrapper

• **wrapper**: *[OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:76](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L76)*

## Methods

###  allowAccess

▸ **allowAccess**(`toAddresses`: Address[], `symmetricKey?`: Buffer): *Promise‹void | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_offchain_accessors_errors_.invalidkey.md)‹››*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L89)*

**Parameters:**

Name | Type |
------ | ------ |
`toAddresses` | Address[] |
`symmetricKey?` | Buffer |

**Returns:** *Promise‹void | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_offchain_accessors_errors_.invalidkey.md)‹››*

___

###  readAsResult

▸ **readAsResult**(`account`: Address): *Promise‹Result‹DataType, [SchemaErrors](../modules/_offchain_accessors_errors_.md#schemaerrors)››*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L93)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |

**Returns:** *Promise‹Result‹DataType, [SchemaErrors](../modules/_offchain_accessors_errors_.md#schemaerrors)››*

___

###  write

▸ **write**(`data`: DataType, `toAddresses`: Address[], `symmetricKey?`: Buffer): *Promise‹void | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_offchain_accessors_errors_.invalidkey.md)‹››*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | DataType |
`toAddresses` | Address[] |
`symmetricKey?` | Buffer |

**Returns:** *Promise‹void | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_offchain_accessors_errors_.invalidkey.md)‹››*
