# PublicNameAccessor

## Hierarchy

* [PublicSimpleAccessor](_offchain_accessors_simple_.publicsimpleaccessor.md)‹[NameType](../modules/_offchain_accessors_name_.md#nametype)›

  ↳ **PublicNameAccessor**

## Implements

* [PublicAccessor](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md)‹[NameType](../modules/_offchain_accessors_name_.md#nametype)›

## Index

### Constructors

* [constructor](_offchain_accessors_name_.publicnameaccessor.md#constructor)

### Properties

* [dataPath](_offchain_accessors_name_.publicnameaccessor.md#readonly-datapath)
* [read](_offchain_accessors_name_.publicnameaccessor.md#read)
* [type](_offchain_accessors_name_.publicnameaccessor.md#readonly-type)
* [wrapper](_offchain_accessors_name_.publicnameaccessor.md#readonly-wrapper)

### Methods

* [readAsResult](_offchain_accessors_name_.publicnameaccessor.md#readasresult)
* [write](_offchain_accessors_name_.publicnameaccessor.md#write)

## Constructors

### constructor

+ **new PublicNameAccessor**\(`wrapper`: [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)\): [_PublicNameAccessor_](_offchain_accessors_name_.publicnameaccessor.md)

_Overrides_ [_PublicSimpleAccessor_](_offchain_accessors_simple_.publicsimpleaccessor.md)_._[_constructor_](_offchain_accessors_simple_.publicsimpleaccessor.md#constructor)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/name.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/name.ts#L11)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** [_PublicNameAccessor_](_offchain_accessors_name_.publicnameaccessor.md)

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Inherited from_ [_PublicSimpleAccessor_](_offchain_accessors_simple_.publicsimpleaccessor.md)_._[_dataPath_](_offchain_accessors_simple_.publicsimpleaccessor.md#readonly-datapath)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L21)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PublicAccessor_](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md)_._[_read_](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md#read)

_Inherited from_ [_PublicSimpleAccessor_](_offchain_accessors_simple_.publicsimpleaccessor.md)_._[_read_](_offchain_accessors_simple_.publicsimpleaccessor.md#read)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L61)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` type

• **type**: _Type‹_[_NameType_](../modules/_offchain_accessors_name_.md#nametype)_›_

_Inherited from_ [_PublicSimpleAccessor_](_offchain_accessors_simple_.publicsimpleaccessor.md)_._[_type_](_offchain_accessors_simple_.publicsimpleaccessor.md#readonly-type)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L20)

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_](_offchain_data_wrapper_.offchaindatawrapper.md)

_Overrides_ [_PublicSimpleAccessor_](_offchain_accessors_simple_.publicsimpleaccessor.md)_._[_wrapper_](_offchain_accessors_simple_.publicsimpleaccessor.md#readonly-wrapper)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/name.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/name.ts#L12)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: Address\): _Promise‹Result‹_[_NameType_](../modules/_offchain_accessors_name_.md#nametype)_,_ [_SchemaErrors_](../modules/_offchain_accessors_errors_.md#schemaerrors)_››_

_Inherited from_ [_PublicSimpleAccessor_](_offchain_accessors_simple_.publicsimpleaccessor.md)_._[_readAsResult_](_offchain_accessors_simple_.publicsimpleaccessor.md#readasresult)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L46)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹Result‹_[_NameType_](../modules/_offchain_accessors_name_.md#nametype)_,_ [_SchemaErrors_](../modules/_offchain_accessors_errors_.md#schemaerrors)_››_

### write

▸ **write**\(`data`: [NameType](../modules/_offchain_accessors_name_.md#nametype)\): _Promise‹undefined \|_ [_InvalidDataError_](_offchain_accessors_errors_.invaliddataerror.md)_‹› \|_ [_OffchainError_](_offchain_accessors_errors_.offchainerror.md)_‹››_

_Inherited from_ [_PublicSimpleAccessor_](_offchain_accessors_simple_.publicsimpleaccessor.md)_._[_write_](_offchain_accessors_simple_.publicsimpleaccessor.md#write)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/simple.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/simple.ts#L30)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | [NameType](../modules/_offchain_accessors_name_.md#nametype) |

**Returns:** _Promise‹undefined \|_ [_InvalidDataError_](_offchain_accessors_errors_.invaliddataerror.md)_‹› \|_ [_OffchainError_](_offchain_accessors_errors_.offchainerror.md)_‹››_

