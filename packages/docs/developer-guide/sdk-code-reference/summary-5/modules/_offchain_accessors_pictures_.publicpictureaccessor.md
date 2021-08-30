# PublicPictureAccessor

## Hierarchy

* [PublicBinaryAccessor]()

  ↳ **PublicPictureAccessor**

## Implements

* [PublicAccessor]()‹Buffer›

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

+ **new PublicPictureAccessor**\(`wrapper`: [OffchainDataWrapper]()\): [_PublicPictureAccessor_]()

_Overrides_ [_PublicBinaryAccessor_]()_._[_constructor_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/pictures.ts:4_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/pictures.ts#L4)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper]() |

**Returns:** [_PublicPictureAccessor_]()

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Inherited from_ [_PublicBinaryAccessor_]()_._[_dataPath_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L12)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PublicAccessor_]()_._[_read_]()

_Inherited from_ [_PublicBinaryAccessor_]()_._[_read_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L35)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_]()

_Overrides_ [_PublicBinaryAccessor_]()_._[_wrapper_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/pictures.ts:5_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/pictures.ts#L5)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: Address\): _Promise‹ErrorResult‹_[_OffchainError_]()_‹›› \| OkResult‹Buffer‹›››_

_Inherited from_ [_PublicBinaryAccessor_]()_._[_readAsResult_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹ErrorResult‹_[_OffchainError_]()_‹›› \| OkResult‹Buffer‹›››_

### write

▸ **write**\(`data`: Buffer\): _Promise‹undefined \|_ [_OffchainError_]()_‹››_

_Inherited from_ [_PublicBinaryAccessor_]()_._[_write_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L14)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |

**Returns:** _Promise‹undefined \|_ [_OffchainError_]()_‹››_

