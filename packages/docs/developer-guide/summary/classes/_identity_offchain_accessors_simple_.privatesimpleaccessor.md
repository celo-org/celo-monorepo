# PrivateSimpleAccessor

A generic schema for writing and reading encrypted objects to and from storage. Passing in a type parameter is supported for runtime type safety.

## Type parameters

▪ **DataType**

## Hierarchy

* **PrivateSimpleAccessor**

  ↳ [PrivateNameAccessor](_identity_offchain_accessors_name_.privatenameaccessor.md)

## Implements

* [PrivateAccessor](../interfaces/_identity_offchain_accessors_interfaces_.privateaccessor.md)‹DataType›

## Index

### Constructors

* [constructor](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#constructor)

### Properties

* [dataPath](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#readonly-datapath)
* [read](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#read)
* [type](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#readonly-type)
* [wrapper](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#readonly-wrapper)

### Methods

* [readAsResult](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#readasresult)
* [write](_identity_offchain_accessors_simple_.privatesimpleaccessor.md#write)

## Constructors

### constructor

+ **new PrivateSimpleAccessor**\(`wrapper`: [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹DataType›, `dataPath`: string\): [_PrivateSimpleAccessor_](_identity_offchain_accessors_simple_.privatesimpleaccessor.md)

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/simple.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L68)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
| `type` | Type‹DataType› |
| `dataPath` | string |

**Returns:** [_PrivateSimpleAccessor_](_identity_offchain_accessors_simple_.privatesimpleaccessor.md)

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/simple.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L72)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PrivateAccessor_](../interfaces/_identity_offchain_accessors_interfaces_.privateaccessor.md)_._[_read_](../interfaces/_identity_offchain_accessors_interfaces_.privateaccessor.md#read)

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/simple.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L93)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` type

• **type**: _Type‹DataType›_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/simple.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L71)

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_](_identity_offchain_data_wrapper_.offchaindatawrapper.md)

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/simple.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L70)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: [Address](../modules/_base_.md#address)\): _Promise‹Result‹DataType,_ [_SchemaErrors_](../modules/_identity_offchain_accessors_errors_.md#schemaerrors)_››_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/simple.ts:83_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L83)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](../modules/_base_.md#address) |

**Returns:** _Promise‹Result‹DataType,_ [_SchemaErrors_](../modules/_identity_offchain_accessors_errors_.md#schemaerrors)_››_

### write

▸ **write**\(`data`: DataType, `toAddresses`: [Address](../modules/_base_.md#address)\[\], `symmetricKey?`: Buffer\): _Promise‹void \|_ [_InvalidDataError_](_identity_offchain_accessors_errors_.invaliddataerror.md)_‹› \|_ [_OffchainError_](_identity_offchain_accessors_errors_.offchainerror.md)_‹› \|_ [_UnknownCiphertext_](_identity_offchain_accessors_errors_.unknownciphertext.md)_‹› \|_ [_UnavailableKey_](_identity_offchain_accessors_errors_.unavailablekey.md)_‹› \|_ [_InvalidKey_](_identity_offchain_accessors_errors_.invalidkey.md)_‹››_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/simple.ts:75_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/simple.ts#L75)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | DataType |
| `toAddresses` | [Address](../modules/_base_.md#address)\[\] |
| `symmetricKey?` | Buffer |

**Returns:** _Promise‹void \|_ [_InvalidDataError_](_identity_offchain_accessors_errors_.invaliddataerror.md)_‹› \|_ [_OffchainError_](_identity_offchain_accessors_errors_.offchainerror.md)_‹› \|_ [_UnknownCiphertext_](_identity_offchain_accessors_errors_.unknownciphertext.md)_‹› \|_ [_UnavailableKey_](_identity_offchain_accessors_errors_.unavailablekey.md)_‹› \|_ [_InvalidKey_](_identity_offchain_accessors_errors_.invalidkey.md)_‹››_

