# PrivatePictureAccessor

## Hierarchy

* [PrivateBinaryAccessor](_offchain_accessors_binary_.privatebinaryaccessor.md)

  ↳ **PrivatePictureAccessor**

## Implements

* [PrivateAccessor](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md)‹Buffer›

## Index

### Constructors

* [constructor](_offchain_accessors_pictures_.privatepictureaccessor.md#constructor)

### Properties

* [dataPath](_offchain_accessors_pictures_.privatepictureaccessor.md#readonly-datapath)
* [read](_offchain_accessors_pictures_.privatepictureaccessor.md#read)
* [wrapper](_offchain_accessors_pictures_.privatepictureaccessor.md#readonly-wrapper)

### Methods

* [readAsResult](_offchain_accessors_pictures_.privatepictureaccessor.md#readasresult)
* [write](_offchain_accessors_pictures_.privatepictureaccessor.md#write)

## Constructors

### constructor

+ **new PrivatePictureAccessor**\(`wrapper`: [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)\): [_PrivatePictureAccessor_](_offchain_accessors_pictures_.privatepictureaccessor.md)

_Overrides_ [_PrivateBinaryAccessor_](_offchain_accessors_binary_.privatebinaryaccessor.md)_._[_constructor_](_offchain_accessors_binary_.privatebinaryaccessor.md#constructor)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/pictures.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/pictures.ts#L10)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** [_PrivatePictureAccessor_](_offchain_accessors_pictures_.privatepictureaccessor.md)

## Properties

### `Readonly` dataPath

• **dataPath**: _string_

_Inherited from_ [_PrivateBinaryAccessor_](_offchain_accessors_binary_.privatebinaryaccessor.md)_._[_dataPath_](_offchain_accessors_binary_.privatebinaryaccessor.md#readonly-datapath)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L42)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Implementation of_ [_PrivateAccessor_](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md)_._[_read_](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md#read)

_Inherited from_ [_PrivateBinaryAccessor_](_offchain_accessors_binary_.privatebinaryaccessor.md)_._[_read_](_offchain_accessors_binary_.privatebinaryaccessor.md#read)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L52)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_](_offchain_data_wrapper_.offchaindatawrapper.md)

_Overrides_ [_PrivateBinaryAccessor_](_offchain_accessors_binary_.privatebinaryaccessor.md)_._[_wrapper_](_offchain_accessors_binary_.privatebinaryaccessor.md#readonly-wrapper)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/pictures.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/pictures.ts#L11)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: Address\): _Promise‹Result‹Buffer‹›,_ [_SchemaErrors_](../modules/_offchain_accessors_errors_.md#schemaerrors)_››_

_Inherited from_ [_PrivateBinaryAccessor_](_offchain_accessors_binary_.privatebinaryaccessor.md)_._[_readAsResult_](_offchain_accessors_binary_.privatebinaryaccessor.md#readasresult)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L48)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹Result‹Buffer‹›,_ [_SchemaErrors_](../modules/_offchain_accessors_errors_.md#schemaerrors)_››_

### write

▸ **write**\(`data`: Buffer, `toAddresses`: Address\[\], `symmetricKey?`: Buffer\): _Promise‹void \|_ [_InvalidDataError_](_offchain_accessors_errors_.invaliddataerror.md)_‹› \|_ [_OffchainError_](_offchain_accessors_errors_.offchainerror.md)_‹› \|_ [_UnknownCiphertext_](_offchain_accessors_errors_.unknownciphertext.md)_‹› \|_ [_UnavailableKey_](_offchain_accessors_errors_.unavailablekey.md)_‹› \|_ [_InvalidKey_](_offchain_accessors_errors_.invalidkey.md)_‹››_

_Inherited from_ [_PrivateBinaryAccessor_](_offchain_accessors_binary_.privatebinaryaccessor.md)_._[_write_](_offchain_accessors_binary_.privatebinaryaccessor.md#write)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/binary.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L44)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |
| `toAddresses` | Address\[\] |
| `symmetricKey?` | Buffer |

**Returns:** _Promise‹void \|_ [_InvalidDataError_](_offchain_accessors_errors_.invaliddataerror.md)_‹› \|_ [_OffchainError_](_offchain_accessors_errors_.offchainerror.md)_‹› \|_ [_UnknownCiphertext_](_offchain_accessors_errors_.unknownciphertext.md)_‹› \|_ [_UnavailableKey_](_offchain_accessors_errors_.unavailablekey.md)_‹› \|_ [_InvalidKey_](_offchain_accessors_errors_.invalidkey.md)_‹››_

