# PublicBinaryAccessor

Schema for writing any generic binary data

## Hierarchy

* **PublicBinaryAccessor**

  ↳ [PublicPictureAccessor]()

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

+ **new PublicBinaryAccessor**\(`wrapper`: [OffchainDataWrapper](), `dataPath`: string\): [_PublicBinaryAccessor_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L11)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper]() |
| `dataPath` | string |

**Returns:** [_PublicBinaryAccessor_]()

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L12)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PublicAccessor_]()_._[_read_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L35)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_]()

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L12)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: Address\): _Promise‹ErrorResult‹_[_OffchainError_]()_‹›› \| OkResult‹Buffer‹›››_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹ErrorResult‹_[_OffchainError_]()_‹›› \| OkResult‹Buffer‹›››_

### write

▸ **write**\(`data`: Buffer\): _Promise‹undefined \|_ [_OffchainError_]()_‹››_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L14)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |

**Returns:** _Promise‹undefined \|_ [_OffchainError_]()_‹››_

