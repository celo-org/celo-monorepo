# PrivateNameAccessor

## Hierarchy

* [PrivateSimpleAccessor]()‹[NameType](_offchain_accessors_name_.md#nametype)›

  ↳ **PrivateNameAccessor**

## Implements

* [PrivateAccessor]()‹[NameType](_offchain_accessors_name_.md#nametype)›

## Index

### Constructors

* [constructor]()

### Properties

* [dataPath]()
* [read]()
* [type]()
* [wrapper]()

### Methods

* [readAsResult]()
* [write]()

## Constructors

### constructor

+ **new PrivateNameAccessor**\(`wrapper`: [OffchainDataWrapper]()\): [_PrivateNameAccessor_]()

_Overrides_ [_PrivateSimpleAccessor_]()_._[_constructor_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/name.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/name.ts#L17)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper]() |

**Returns:** [_PrivateNameAccessor_]()

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Inherited from_ [_PrivateSimpleAccessor_]()_._[_dataPath_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L72)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PrivateAccessor_]()_._[_read_]()

_Inherited from_ [_PrivateSimpleAccessor_]()_._[_read_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L93)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` type

• **type**: _Type‹_[_NameType_](_offchain_accessors_name_.md#nametype)_›_

_Inherited from_ [_PrivateSimpleAccessor_]()_._[_type_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L71)

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_]()

_Overrides_ [_PrivateSimpleAccessor_]()_._[_wrapper_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/name.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/name.ts#L18)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: Address\): _Promise‹Result‹_[_NameType_](_offchain_accessors_name_.md#nametype)_,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

_Inherited from_ [_PrivateSimpleAccessor_]()_._[_readAsResult_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:83_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L83)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹Result‹_[_NameType_](_offchain_accessors_name_.md#nametype)_,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

### write

▸ **write**\(`data`: [NameType](_offchain_accessors_name_.md#nametype), `toAddresses`: Address\[\], `symmetricKey?`: Buffer\): _Promise‹void \|_ [_InvalidDataError_]()_‹› \|_ [_OffchainError_]()_‹› \|_ [_UnknownCiphertext_]()_‹› \|_ [_UnavailableKey_]()_‹› \|_ [_InvalidKey_]()_‹››_

_Inherited from_ [_PrivateSimpleAccessor_]()_._[_write_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:75_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L75)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | [NameType](_offchain_accessors_name_.md#nametype) |
| `toAddresses` | Address\[\] |
| `symmetricKey?` | Buffer |

**Returns:** _Promise‹void \|_ [_InvalidDataError_]()_‹› \|_ [_OffchainError_]()_‹› \|_ [_UnknownCiphertext_]()_‹› \|_ [_UnavailableKey_]()_‹› \|_ [_InvalidKey_]()_‹››_

