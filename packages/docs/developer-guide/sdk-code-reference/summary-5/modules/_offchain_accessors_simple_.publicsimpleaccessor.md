# PublicSimpleAccessor

A generic schema for reading and writing objects to and from storage. Passing in a type parameter is supported for runtime type safety.

## Type parameters

▪ **DataType**

## Hierarchy

* **PublicSimpleAccessor**

  ↳ [PublicNameAccessor]()

## Implements

* [PublicAccessor]()‹DataType›

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

+ **new PublicSimpleAccessor**\(`wrapper`: [OffchainDataWrapper](), `type`: Type‹DataType›, `dataPath`: string\): [_PublicSimpleAccessor_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L17)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper]() |
| `type` | Type‹DataType› |
| `dataPath` | string |

**Returns:** [_PublicSimpleAccessor_]()

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L21)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PublicAccessor_]()_._[_read_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L61)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` type

• **type**: _Type‹DataType›_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L20)

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L19)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: Address\): _Promise‹Result‹DataType,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L46)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹Result‹DataType,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

### write

▸ **write**\(`data`: DataType\): _Promise‹undefined \|_ [_InvalidDataError_]()_‹› \|_ [_OffchainError_]()_‹››_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L30)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | DataType |

**Returns:** _Promise‹undefined \|_ [_InvalidDataError_]()_‹› \|_ [_OffchainError_]()_‹››_

