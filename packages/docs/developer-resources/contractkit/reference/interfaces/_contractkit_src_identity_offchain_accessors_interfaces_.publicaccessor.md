# Interface: PublicAccessor <**DataType**>

## Type parameters

▪ **DataType**

## Hierarchy

* **PublicAccessor**

## Implemented by

* [PublicBinaryAccessor](../classes/_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md)
* [PublicNameAccessor](../classes/_contractkit_src_identity_offchain_accessors_name_.publicnameaccessor.md)
* [PublicPictureAccessor](../classes/_contractkit_src_identity_offchain_accessors_pictures_.publicpictureaccessor.md)
* [PublicSimpleAccessor](../classes/_contractkit_src_identity_offchain_accessors_simple_.publicsimpleaccessor.md)

## Index

### Properties

* [read](_contractkit_src_identity_offchain_accessors_interfaces_.publicaccessor.md#read)
* [readAsResult](_contractkit_src_identity_offchain_accessors_interfaces_.publicaccessor.md#readasresult)
* [write](_contractkit_src_identity_offchain_accessors_interfaces_.publicaccessor.md#write)

## Properties

###  read

• **read**: *function*

*Defined in [packages/contractkit/src/identity/offchain/accessors/interfaces.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/interfaces.ts#L6)*

#### Type declaration:

▸ (`from`: string): *Promise‹DataType›*

**Parameters:**

Name | Type |
------ | ------ |
`from` | string |

___

###  readAsResult

• **readAsResult**: *function*

*Defined in [packages/contractkit/src/identity/offchain/accessors/interfaces.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/interfaces.ts#L7)*

#### Type declaration:

▸ (`from`: string): *Promise‹[Result](../modules/_base_src_result_.md#result)‹DataType, [SchemaErrors](../modules/_contractkit_src_identity_offchain_accessors_errors_.md#schemaerrors)››*

**Parameters:**

Name | Type |
------ | ------ |
`from` | string |

___

###  write

• **write**: *function*

*Defined in [packages/contractkit/src/identity/offchain/accessors/interfaces.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/interfaces.ts#L5)*

#### Type declaration:

▸ (`data`: DataType): *Promise‹[SchemaErrors](../modules/_contractkit_src_identity_offchain_accessors_errors_.md#schemaerrors) | void›*

**Parameters:**

Name | Type |
------ | ------ |
`data` | DataType |
