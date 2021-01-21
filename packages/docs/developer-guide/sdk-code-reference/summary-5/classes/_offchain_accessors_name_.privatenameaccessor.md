# PrivateNameAccessor

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

* [readAsResult](_offchain_accessors_name_.privatenameaccessor.md#readasresult)
* [write](_offchain_accessors_name_.privatenameaccessor.md#write)

## Constructors

### constructor

+ **new PrivateNameAccessor**\(`wrapper`: [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)\): [_PrivateNameAccessor_](_offchain_accessors_name_.privatenameaccessor.md)

_Overrides_ [_PrivateSimpleAccessor_](_offchain_accessors_simple_.privatesimpleaccessor.md)_._[_constructor_](_offchain_accessors_simple_.privatesimpleaccessor.md#constructor)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/name.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/name.ts#L17)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** [_PrivateNameAccessor_](_offchain_accessors_name_.privatenameaccessor.md)

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Inherited from_ [_PrivateSimpleAccessor_](_offchain_accessors_simple_.privatesimpleaccessor.md)_._[_dataPath_](_offchain_accessors_simple_.privatesimpleaccessor.md#readonly-datapath)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L72)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PrivateAccessor_](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md)_._[_read_](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md#read)

_Inherited from_ [_PrivateSimpleAccessor_](_offchain_accessors_simple_.privatesimpleaccessor.md)_._[_read_](_offchain_accessors_simple_.privatesimpleaccessor.md#read)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L93)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` type

• **type**: _Type‹_[_NameType_](../modules/_offchain_accessors_name_.md#nametype)_›_

_Inherited from_ [_PrivateSimpleAccessor_](_offchain_accessors_simple_.privatesimpleaccessor.md)_._[_type_](_offchain_accessors_simple_.privatesimpleaccessor.md#readonly-type)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L71)

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_](_offchain_data_wrapper_.offchaindatawrapper.md)

_Overrides_ [_PrivateSimpleAccessor_](_offchain_accessors_simple_.privatesimpleaccessor.md)_._[_wrapper_](_offchain_accessors_simple_.privatesimpleaccessor.md#readonly-wrapper)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/name.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/name.ts#L18)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: Address\): _Promise‹Result‹_[_NameType_](../modules/_offchain_accessors_name_.md#nametype)_,_ [_SchemaErrors_](../modules/_offchain_accessors_errors_.md#schemaerrors)_››_

_Inherited from_ [_PrivateSimpleAccessor_](_offchain_accessors_simple_.privatesimpleaccessor.md)_._[_readAsResult_](_offchain_accessors_simple_.privatesimpleaccessor.md#readasresult)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:83_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L83)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹Result‹_[_NameType_](../modules/_offchain_accessors_name_.md#nametype)_,_ [_SchemaErrors_](../modules/_offchain_accessors_errors_.md#schemaerrors)_››_

### write

▸ **write**\(`data`: [NameType](../modules/_offchain_accessors_name_.md#nametype), `toAddresses`: Address\[\], `symmetricKey?`: Buffer\): _Promise‹void \|_ [_InvalidDataError_](_offchain_accessors_errors_.invaliddataerror.md)_‹› \|_ [_OffchainError_](_offchain_accessors_errors_.offchainerror.md)_‹› \|_ [_UnknownCiphertext_](_offchain_accessors_errors_.unknownciphertext.md)_‹› \|_ [_UnavailableKey_](_offchain_accessors_errors_.unavailablekey.md)_‹› \|_ [_InvalidKey_](_offchain_accessors_errors_.invalidkey.md)_‹››_

_Inherited from_ [_PrivateSimpleAccessor_](_offchain_accessors_simple_.privatesimpleaccessor.md)_._[_write_](_offchain_accessors_simple_.privatesimpleaccessor.md#write)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:75_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L75)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | [NameType](../modules/_offchain_accessors_name_.md#nametype) |
| `toAddresses` | Address\[\] |
| `symmetricKey?` | Buffer |

**Returns:** _Promise‹void \|_ [_InvalidDataError_](_offchain_accessors_errors_.invaliddataerror.md)_‹› \|_ [_OffchainError_](_offchain_accessors_errors_.offchainerror.md)_‹› \|_ [_UnknownCiphertext_](_offchain_accessors_errors_.unknownciphertext.md)_‹› \|_ [_UnavailableKey_](_offchain_accessors_errors_.unavailablekey.md)_‹› \|_ [_InvalidKey_](_offchain_accessors_errors_.invalidkey.md)_‹››_

