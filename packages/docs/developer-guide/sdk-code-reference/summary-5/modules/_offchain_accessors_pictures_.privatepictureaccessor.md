# PrivatePictureAccessor

## Hierarchy

* [PrivateBinaryAccessor]()

  ↳ **PrivatePictureAccessor**

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

+ **new PrivatePictureAccessor**\(`wrapper`: [OffchainDataWrapper]()\): [_PrivatePictureAccessor_]()

_Overrides_ [_PrivateBinaryAccessor_]()_._[_constructor_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/pictures.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/pictures.ts#L10)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper]() |

**Returns:** [_PrivatePictureAccessor_]()

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Inherited from_ [_PrivateBinaryAccessor_]()_._[_dataPath_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L42)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PrivateAccessor_]()_._[_read_]()

_Inherited from_ [_PrivateBinaryAccessor_]()_._[_read_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L52)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_]()

_Overrides_ [_PrivateBinaryAccessor_]()_._[_wrapper_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/pictures.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/pictures.ts#L11)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: Address\): _Promise‹Result‹Buffer‹›,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

_Inherited from_ [_PrivateBinaryAccessor_]()_._[_readAsResult_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L48)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹Result‹Buffer‹›,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

### write

▸ **write**\(`data`: Buffer, `toAddresses`: Address\[\], `symmetricKey?`: Buffer\): _Promise‹void \|_ [_InvalidDataError_]()_‹› \|_ [_OffchainError_]()_‹› \|_ [_UnknownCiphertext_]()_‹› \|_ [_UnavailableKey_]()_‹› \|_ [_InvalidKey_]()_‹››_

_Inherited from_ [_PrivateBinaryAccessor_]()_._[_write_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L44)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |
| `toAddresses` | Address\[\] |
| `symmetricKey?` | Buffer |

**Returns:** _Promise‹void \|_ [_InvalidDataError_]()_‹› \|_ [_OffchainError_]()_‹› \|_ [_UnknownCiphertext_]()_‹› \|_ [_UnavailableKey_]()_‹› \|_ [_InvalidKey_]()_‹››_

