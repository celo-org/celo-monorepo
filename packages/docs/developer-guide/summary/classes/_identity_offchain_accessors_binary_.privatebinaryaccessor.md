# PrivateBinaryAccessor

Schema for writing any encrypted binary data.

## Hierarchy

* **PrivateBinaryAccessor**

  ↳ [PrivatePictureAccessor](_identity_offchain_accessors_pictures_.privatepictureaccessor.md)

## Implements

* [PrivateAccessor](../interfaces/_identity_offchain_accessors_interfaces_.privateaccessor.md)‹Buffer›

## Index

### Constructors

* [constructor](_identity_offchain_accessors_binary_.privatebinaryaccessor.md#constructor)

### Properties

* [dataPath](_identity_offchain_accessors_binary_.privatebinaryaccessor.md#readonly-datapath)
* [read](_identity_offchain_accessors_binary_.privatebinaryaccessor.md#read)
* [wrapper](_identity_offchain_accessors_binary_.privatebinaryaccessor.md#readonly-wrapper)

### Methods

* [readAsResult](_identity_offchain_accessors_binary_.privatebinaryaccessor.md#readasresult)
* [write](_identity_offchain_accessors_binary_.privatebinaryaccessor.md#write)

## Constructors

### constructor

+ **new PrivateBinaryAccessor**\(`wrapper`: [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md), `dataPath`: string\): [_PrivateBinaryAccessor_](_identity_offchain_accessors_binary_.privatebinaryaccessor.md)

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/binary.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L41)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
| `dataPath` | string |

**Returns:** [_PrivateBinaryAccessor_](_identity_offchain_accessors_binary_.privatebinaryaccessor.md)

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/binary.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L42)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PrivateAccessor_](../interfaces/_identity_offchain_accessors_interfaces_.privateaccessor.md)_._[_read_](../interfaces/_identity_offchain_accessors_interfaces_.privateaccessor.md#read)

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/binary.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L52)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_](_identity_offchain_data_wrapper_.offchaindatawrapper.md)

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/binary.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L42)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: [Address](../modules/_base_.md#address)\): _Promise‹Result‹Buffer‹›,_ [_SchemaErrors_](../modules/_identity_offchain_accessors_errors_.md#schemaerrors)_››_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/binary.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L48)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](../modules/_base_.md#address) |

**Returns:** _Promise‹Result‹Buffer‹›,_ [_SchemaErrors_](../modules/_identity_offchain_accessors_errors_.md#schemaerrors)_››_

### write

▸ **write**\(`data`: Buffer, `toAddresses`: [Address](../modules/_base_.md#address)\[\], `symmetricKey?`: Buffer\): _Promise‹void \|_ [_InvalidDataError_](_identity_offchain_accessors_errors_.invaliddataerror.md)_‹› \|_ [_OffchainError_](_identity_offchain_accessors_errors_.offchainerror.md)_‹› \|_ [_UnknownCiphertext_](_identity_offchain_accessors_errors_.unknownciphertext.md)_‹› \|_ [_UnavailableKey_](_identity_offchain_accessors_errors_.unavailablekey.md)_‹› \|_ [_InvalidKey_](_identity_offchain_accessors_errors_.invalidkey.md)_‹››_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/binary.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L44)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |
| `toAddresses` | [Address](../modules/_base_.md#address)\[\] |
| `symmetricKey?` | Buffer |

**Returns:** _Promise‹void \|_ [_InvalidDataError_](_identity_offchain_accessors_errors_.invaliddataerror.md)_‹› \|_ [_OffchainError_](_identity_offchain_accessors_errors_.offchainerror.md)_‹› \|_ [_UnknownCiphertext_](_identity_offchain_accessors_errors_.unknownciphertext.md)_‹› \|_ [_UnavailableKey_](_identity_offchain_accessors_errors_.unavailablekey.md)_‹› \|_ [_InvalidKey_](_identity_offchain_accessors_errors_.invalidkey.md)_‹››_

