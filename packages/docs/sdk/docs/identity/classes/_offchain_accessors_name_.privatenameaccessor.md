[@celo/identity](../README.md) › ["offchain/accessors/name"](../modules/_offchain_accessors_name_.md) › [PrivateNameAccessor](_offchain_accessors_name_.privatenameaccessor.md)

# Class: PrivateNameAccessor

## Hierarchy

* [PrivateSimpleAccessor](_offchain_accessors_simple_.privatesimpleaccessor.md)‹[NameType](../modules/_offchain_accessors_name_.md#nametype)›

  ↳ **PrivateNameAccessor**

## Implements

* [PrivateAccessor](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md)‹[NameType](../modules/_offchain_accessors_name_.md#nametype)›

## Index

### Constructors

* [constructor](_offchain_accessors_name_.privatenameaccessor.md#constructor)

### Properties

* [dataPath](_offchain_accessors_name_.privatenameaccessor.md#readonly-datapath)
* [read](_offchain_accessors_name_.privatenameaccessor.md#read)
* [type](_offchain_accessors_name_.privatenameaccessor.md#readonly-type)
* [wrapper](_offchain_accessors_name_.privatenameaccessor.md#readonly-wrapper)

### Methods

* [allowAccess](_offchain_accessors_name_.privatenameaccessor.md#allowaccess)
* [readAsResult](_offchain_accessors_name_.privatenameaccessor.md#readasresult)
* [write](_offchain_accessors_name_.privatenameaccessor.md#write)

## Constructors

###  constructor

\+ **new PrivateNameAccessor**(`wrapper`: [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md)): *[PrivateNameAccessor](_offchain_accessors_name_.privatenameaccessor.md)*

*Overrides [PrivateSimpleAccessor](_offchain_accessors_simple_.privatesimpleaccessor.md).[constructor](_offchain_accessors_simple_.privatesimpleaccessor.md#constructor)*

*Defined in [packages/sdk/identity/src/offchain/accessors/name.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/name.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** *[PrivateNameAccessor](_offchain_accessors_name_.privatenameaccessor.md)*

## Properties

### `Readonly` dataPath

• **dataPath**: *string*

*Inherited from [PrivateSimpleAccessor](_offchain_accessors_simple_.privatesimpleaccessor.md).[dataPath](_offchain_accessors_simple_.privatesimpleaccessor.md#readonly-datapath)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L78)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PrivateAccessor](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md).[read](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md#read)*

*Inherited from [PrivateSimpleAccessor](_offchain_accessors_simple_.privatesimpleaccessor.md).[read](_offchain_accessors_simple_.privatesimpleaccessor.md#read)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:103](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L103)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

### `Readonly` type

• **type**: *Type‹[NameType](../modules/_offchain_accessors_name_.md#nametype)›*

*Inherited from [PrivateSimpleAccessor](_offchain_accessors_simple_.privatesimpleaccessor.md).[type](_offchain_accessors_simple_.privatesimpleaccessor.md#readonly-type)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L77)*

___

### `Readonly` wrapper

• **wrapper**: *[OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md)*

*Overrides [PrivateSimpleAccessor](_offchain_accessors_simple_.privatesimpleaccessor.md).[wrapper](_offchain_accessors_simple_.privatesimpleaccessor.md#readonly-wrapper)*

*Defined in [packages/sdk/identity/src/offchain/accessors/name.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/name.ts#L18)*

## Methods

###  allowAccess

▸ **allowAccess**(`toAddresses`: Address[], `symmetricKey?`: Buffer): *Promise‹void | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_offchain_accessors_errors_.invalidkey.md)‹››*

*Inherited from [PrivateSimpleAccessor](_offchain_accessors_simple_.privatesimpleaccessor.md).[allowAccess](_offchain_accessors_simple_.privatesimpleaccessor.md#allowaccess)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L89)*

**Parameters:**

Name | Type |
------ | ------ |
`toAddresses` | Address[] |
`symmetricKey?` | Buffer |

**Returns:** *Promise‹void | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_offchain_accessors_errors_.invalidkey.md)‹››*

___

###  readAsResult

▸ **readAsResult**(`account`: Address): *Promise‹Result‹[NameType](../modules/_offchain_accessors_name_.md#nametype), [SchemaErrors](../modules/_offchain_accessors_errors_.md#schemaerrors)››*

*Inherited from [PrivateSimpleAccessor](_offchain_accessors_simple_.privatesimpleaccessor.md).[readAsResult](_offchain_accessors_simple_.privatesimpleaccessor.md#readasresult)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L93)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |

**Returns:** *Promise‹Result‹[NameType](../modules/_offchain_accessors_name_.md#nametype), [SchemaErrors](../modules/_offchain_accessors_errors_.md#schemaerrors)››*

___

###  write

▸ **write**(`data`: [NameType](../modules/_offchain_accessors_name_.md#nametype), `toAddresses`: Address[], `symmetricKey?`: Buffer): *Promise‹void | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_offchain_accessors_errors_.invalidkey.md)‹››*

*Inherited from [PrivateSimpleAccessor](_offchain_accessors_simple_.privatesimpleaccessor.md).[write](_offchain_accessors_simple_.privatesimpleaccessor.md#write)*

*Defined in [packages/sdk/identity/src/offchain/accessors/simple.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [NameType](../modules/_offchain_accessors_name_.md#nametype) |
`toAddresses` | Address[] |
`symmetricKey?` | Buffer |

**Returns:** *Promise‹void | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_offchain_accessors_errors_.invalidkey.md)‹››*
