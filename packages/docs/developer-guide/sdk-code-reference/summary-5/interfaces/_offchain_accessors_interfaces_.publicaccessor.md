# PublicAccessor

## Type parameters

▪ **DataType**

## Hierarchy

* **PublicAccessor**

## Implemented by

* [PublicBinaryAccessor](../classes/_offchain_accessors_binary_.publicbinaryaccessor.md)
* [PublicNameAccessor](../classes/_offchain_accessors_name_.publicnameaccessor.md)
* [PublicPictureAccessor](../classes/_offchain_accessors_pictures_.publicpictureaccessor.md)
* [PublicSimpleAccessor](../classes/_offchain_accessors_simple_.publicsimpleaccessor.md)

## Index

### Properties

* [read](_offchain_accessors_interfaces_.publicaccessor.md#read)
* [readAsResult](_offchain_accessors_interfaces_.publicaccessor.md#readasresult)
* [write](_offchain_accessors_interfaces_.publicaccessor.md#write)

## Properties

### read

• **read**: _function_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/interfaces.ts:6_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/interfaces.ts#L6)

#### Type declaration:

▸ \(`from`: string\): _Promise‹DataType›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `from` | string |

### readAsResult

• **readAsResult**: _function_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/interfaces.ts:7_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/interfaces.ts#L7)

#### Type declaration:

▸ \(`from`: string\): _Promise‹Result‹DataType,_ [_SchemaErrors_](../modules/_offchain_accessors_errors_.md#schemaerrors)_››_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `from` | string |

### write

• **write**: _function_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/interfaces.ts:5_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/interfaces.ts#L5)

#### Type declaration:

▸ \(`data`: DataType\): _Promise‹_[_SchemaErrors_](../modules/_offchain_accessors_errors_.md#schemaerrors) _\| void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | DataType |

