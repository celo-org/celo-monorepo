# PrivateSimpleAccessor

A generic schema for writing and reading encrypted objects to and from storage. Passing in a type parameter is supported for runtime type safety.

## Type parameters

▪ **DataType**

## Hierarchy

* **PrivateSimpleAccessor**

  ↳ [PrivateNameAccessor]()

## Implements

* [PrivateAccessor]()‹DataType›

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

+ **new PrivateSimpleAccessor**\(`wrapper`: [OffchainDataWrapper](), `type`: Type‹DataType›, `dataPath`: string\): [_PrivateSimpleAccessor_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L68)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper]() |
| `type` | Type‹DataType› |
| `dataPath` | string |

**Returns:** [_PrivateSimpleAccessor_]()

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L72)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PrivateAccessor_]()_._[_read_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L93)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` type

• **type**: _Type‹DataType›_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L71)

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L70)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: Address\): _Promise‹Result‹DataType,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:83_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L83)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹Result‹DataType,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

### write

▸ **write**\(`data`: DataType, `toAddresses`: Address\[\], `symmetricKey?`: Buffer\): _Promise‹void \|_ [_InvalidDataError_]()_‹› \|_ [_OffchainError_]()_‹› \|_ [_UnknownCiphertext_]()_‹› \|_ [_UnavailableKey_]()_‹› \|_ [_InvalidKey_]()_‹››_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:75_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L75)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | DataType |
| `toAddresses` | Address\[\] |
| `symmetricKey?` | Buffer |

**Returns:** _Promise‹void \|_ [_InvalidDataError_]()_‹› \|_ [_OffchainError_]()_‹› \|_ [_UnknownCiphertext_]()_‹› \|_ [_UnavailableKey_]()_‹› \|_ [_InvalidKey_]()_‹››_

