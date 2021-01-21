# PublicSimpleAccessor

A generic schema for reading and writing objects to and from storage. Passing in a type parameter is supported for runtime type safety.

## Type parameters

▪ **DataType**

## Hierarchy

* **PublicSimpleAccessor**

  ↳ [PublicNameAccessor](_offchain_accessors_name_.publicnameaccessor.md)

## Implements

* [PublicAccessor](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md)‹DataType›

## Index

### Constructors

* [constructor](_offchain_accessors_simple_.publicsimpleaccessor.md#constructor)

### Properties

* [dataPath](_offchain_accessors_simple_.publicsimpleaccessor.md#readonly-datapath)
* [read](_offchain_accessors_simple_.publicsimpleaccessor.md#read)
* [type](_offchain_accessors_simple_.publicsimpleaccessor.md#readonly-type)
* [wrapper](_offchain_accessors_simple_.publicsimpleaccessor.md#readonly-wrapper)

### Methods

* [readAsResult](_offchain_accessors_simple_.publicsimpleaccessor.md#readasresult)
* [write](_offchain_accessors_simple_.publicsimpleaccessor.md#write)

## Constructors

### constructor

+ **new PublicSimpleAccessor**\(`wrapper`: [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md), `type`: Type‹DataType›, `dataPath`: string\): [_PublicSimpleAccessor_](_offchain_accessors_simple_.publicsimpleaccessor.md)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L17)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md) |
| `type` | Type‹DataType› |
| `dataPath` | string |

**Returns:** [_PublicSimpleAccessor_](_offchain_accessors_simple_.publicsimpleaccessor.md)

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L21)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PublicAccessor_](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md)_._[_read_](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md#read)

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

• **wrapper**: [_OffchainDataWrapper_](_offchain_data_wrapper_.offchaindatawrapper.md)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L19)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: Address\): _Promise‹Result‹DataType,_ [_SchemaErrors_](../modules/_offchain_accessors_errors_.md#schemaerrors)_››_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L46)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹Result‹DataType,_ [_SchemaErrors_](../modules/_offchain_accessors_errors_.md#schemaerrors)_››_

### write

▸ **write**\(`data`: DataType\): _Promise‹undefined \|_ [_InvalidDataError_](_offchain_accessors_errors_.invaliddataerror.md)_‹› \|_ [_OffchainError_](_offchain_accessors_errors_.offchainerror.md)_‹››_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L30)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | DataType |

**Returns:** _Promise‹undefined \|_ [_InvalidDataError_](_offchain_accessors_errors_.invaliddataerror.md)_‹› \|_ [_OffchainError_](_offchain_accessors_errors_.offchainerror.md)_‹››_

