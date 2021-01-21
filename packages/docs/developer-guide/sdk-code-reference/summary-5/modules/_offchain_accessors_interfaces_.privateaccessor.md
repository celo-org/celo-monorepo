# PrivateAccessor

## Type parameters

▪ **DataType**

## Hierarchy

* **PrivateAccessor**

## Implemented by

* [PrivateBinaryAccessor]()
* [PrivateNameAccessor]()
* [PrivatePictureAccessor]()
* [PrivateSimpleAccessor]()

## Index

### Properties

* [read]()
* [readAsResult]()
* [write]()

## Properties

### read

• **read**: _function_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/interfaces.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/interfaces.ts#L12)

#### Type declaration:

▸ \(`from`: string\): _Promise‹DataType›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `from` | string |

### readAsResult

• **readAsResult**: _function_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/interfaces.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/interfaces.ts#L13)

#### Type declaration:

▸ \(`from`: string\): _Promise‹Result‹DataType,_ [_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors)_››_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `from` | string |

### write

• **write**: _function_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/interfaces.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/interfaces.ts#L11)

#### Type declaration:

▸ \(`data`: DataType, `to`: string\[\], `symmetricKey?`: Buffer\): _Promise‹_[_SchemaErrors_](_offchain_accessors_errors_.md#schemaerrors) _\| void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | DataType |
| `to` | string\[\] |
| `symmetricKey?` | Buffer |

