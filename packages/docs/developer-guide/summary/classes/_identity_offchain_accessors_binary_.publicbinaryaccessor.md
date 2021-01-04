# PublicBinaryAccessor

Schema for writing any generic binary data

## Hierarchy

* **PublicBinaryAccessor**

  ↳ [PublicPictureAccessor](_identity_offchain_accessors_pictures_.publicpictureaccessor.md)

## Implements

* [PublicAccessor](../interfaces/_identity_offchain_accessors_interfaces_.publicaccessor.md)‹Buffer›

## Index

### Constructors

* [constructor](_identity_offchain_accessors_binary_.publicbinaryaccessor.md#constructor)

### Properties

* [dataPath](_identity_offchain_accessors_binary_.publicbinaryaccessor.md#readonly-datapath)
* [read](_identity_offchain_accessors_binary_.publicbinaryaccessor.md#read)
* [wrapper](_identity_offchain_accessors_binary_.publicbinaryaccessor.md#readonly-wrapper)

### Methods

* [readAsResult](_identity_offchain_accessors_binary_.publicbinaryaccessor.md#readasresult)
* [write](_identity_offchain_accessors_binary_.publicbinaryaccessor.md#write)

## Constructors

### constructor

+ **new PublicBinaryAccessor**\(`wrapper`: [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md), `dataPath`: string\): [_PublicBinaryAccessor_](_identity_offchain_accessors_binary_.publicbinaryaccessor.md)

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/binary.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L11)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
| `dataPath` | string |

**Returns:** [_PublicBinaryAccessor_](_identity_offchain_accessors_binary_.publicbinaryaccessor.md)

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/binary.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L12)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PublicAccessor_](../interfaces/_identity_offchain_accessors_interfaces_.publicaccessor.md)_._[_read_](../interfaces/_identity_offchain_accessors_interfaces_.publicaccessor.md#read)

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/binary.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L35)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_](_identity_offchain_data_wrapper_.offchaindatawrapper.md)

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/binary.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L12)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: [Address](../modules/_base_.md#address)\): _Promise‹ErrorResult‹_[_OffchainError_](_identity_offchain_accessors_errors_.offchainerror.md)_‹›› \| OkResult‹Buffer‹›››_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/binary.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](../modules/_base_.md#address) |

**Returns:** _Promise‹ErrorResult‹_[_OffchainError_](_identity_offchain_accessors_errors_.offchainerror.md)_‹›› \| OkResult‹Buffer‹›››_

### write

▸ **write**\(`data`: Buffer\): _Promise‹undefined \|_ [_OffchainError_](_identity_offchain_accessors_errors_.offchainerror.md)_‹››_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/binary.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L14)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |

**Returns:** _Promise‹undefined \|_ [_OffchainError_](_identity_offchain_accessors_errors_.offchainerror.md)_‹››_

