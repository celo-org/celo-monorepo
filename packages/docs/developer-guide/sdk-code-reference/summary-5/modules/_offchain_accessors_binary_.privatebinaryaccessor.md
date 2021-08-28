# PrivateBinaryAccessor

Schema for writing any encrypted binary data.

## Hierarchy

* **PrivateBinaryAccessor**

  ↳ [PrivatePictureAccessor]()

## Implements

* [PrivateAccessor]()‹Buffer›

## Index

### Constructors

* [constructor]()

### Properties

* [dataPath]()
* [read]()
* [wrapper]()

### Methods

* [readAsResult]()
* [write]()

## Constructors

### constructor

+ **new PrivateBinaryAccessor**\(`wrapper`: [OffchainDataWrapper](), `dataPath`: string\): [_PrivateBinaryAccessor_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L41)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper]() |
| `dataPath` | string |

**Returns:** [_PrivateBinaryAccessor_]()

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L42)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PrivateAccessor_]()_._[_read_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L52)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L42)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: Address\): _Promise‹Result‹Buffer‹›,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L48)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹Result‹Buffer‹›,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

### write

▸ **write**\(`data`: Buffer, `toAddresses`: Address\[\], `symmetricKey?`: Buffer\): _Promise‹void \|_ [_InvalidDataError_]()_‹› \|_ [_OffchainError_]()_‹› \|_ [_UnknownCiphertext_]()_‹› \|_ [_UnavailableKey_]()_‹› \|_ [_InvalidKey_]()_‹››_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L44)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |
| `toAddresses` | Address\[\] |
| `symmetricKey?` | Buffer |

**Returns:** _Promise‹void \|_ [_InvalidDataError_]()_‹› \|_ [_OffchainError_]()_‹› \|_ [_UnknownCiphertext_]()_‹› \|_ [_UnavailableKey_]()_‹› \|_ [_InvalidKey_]()_‹››_

