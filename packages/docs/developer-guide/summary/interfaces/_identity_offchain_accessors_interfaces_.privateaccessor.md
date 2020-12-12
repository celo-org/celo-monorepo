# PrivateAccessor

## Type parameters

▪ **DataType**

## Hierarchy

* **PrivateAccessor**

## Implemented by

* [PrivateBinaryAccessor](../classes/_identity_offchain_accessors_binary_.privatebinaryaccessor.md)
* [PrivateNameAccessor](../classes/_identity_offchain_accessors_name_.privatenameaccessor.md)
* [PrivatePictureAccessor](../classes/_identity_offchain_accessors_pictures_.privatepictureaccessor.md)
* [PrivateSimpleAccessor](../classes/_identity_offchain_accessors_simple_.privatesimpleaccessor.md)

## Index

### Properties

* [read](_identity_offchain_accessors_interfaces_.privateaccessor.md#read)
* [readAsResult](_identity_offchain_accessors_interfaces_.privateaccessor.md#readasresult)
* [write](_identity_offchain_accessors_interfaces_.privateaccessor.md#write)

## Properties

### read

• **read**: _function_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/interfaces.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/interfaces.ts#L12)

#### Type declaration:

▸ \(`from`: string\): _Promise‹DataType›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `from` | string |

### readAsResult

• **readAsResult**: _function_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/interfaces.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/interfaces.ts#L13)

#### Type declaration:

▸ \(`from`: string\): _Promise‹Result‹DataType,_ [_SchemaErrors_](../modules/_identity_offchain_accessors_errors_.md#schemaerrors)_››_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `from` | string |

### write

• **write**: _function_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/interfaces.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/interfaces.ts#L11)

#### Type declaration:

▸ \(`data`: DataType, `to`: string\[\], `symmetricKey?`: Buffer\): _Promise‹_[_SchemaErrors_](../modules/_identity_offchain_accessors_errors_.md#schemaerrors) _\| void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | DataType |
| `to` | string\[\] |
| `symmetricKey?` | Buffer |

