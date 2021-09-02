# PublicNameAccessor

## Hierarchy

* [PublicSimpleAccessor]()‹[NameType](_offchain_accessors_name_.md#nametype)›

  ↳ **PublicNameAccessor**

## Implements

* [PublicAccessor]()‹[NameType](_offchain_accessors_name_.md#nametype)›

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

+ **new PublicNameAccessor**\(`wrapper`: [OffchainDataWrapper]()\): [_PublicNameAccessor_]()

_Overrides_ [_PublicSimpleAccessor_]()_._[_constructor_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/name.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/name.ts#L11)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper]() |

**Returns:** [_PublicNameAccessor_]()

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Inherited from_ [_PublicSimpleAccessor_]()_._[_dataPath_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L21)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PublicAccessor_]()_._[_read_]()

_Inherited from_ [_PublicSimpleAccessor_]()_._[_read_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L61)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` type

• **type**: _Type‹_[_NameType_](_offchain_accessors_name_.md#nametype)_›_

_Inherited from_ [_PublicSimpleAccessor_]()_._[_type_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L20)

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_]()

_Overrides_ [_PublicSimpleAccessor_]()_._[_wrapper_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/name.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/name.ts#L12)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: Address\): _Promise‹Result‹_[_NameType_](_offchain_accessors_name_.md#nametype)_,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

_Inherited from_ [_PublicSimpleAccessor_]()_._[_readAsResult_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L46)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹Result‹_[_NameType_](_offchain_accessors_name_.md#nametype)_,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

### write

▸ **write**\(`data`: [NameType](_offchain_accessors_name_.md#nametype)\): _Promise‹undefined \|_ [_InvalidDataError_]()_‹› \|_ [_OffchainError_]()_‹››_

_Inherited from_ [_PublicSimpleAccessor_]()_._[_write_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L30)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | [NameType](_offchain_accessors_name_.md#nametype) |

**Returns:** _Promise‹undefined \|_ [_InvalidDataError_]()_‹› \|_ [_OffchainError_]()_‹››_

