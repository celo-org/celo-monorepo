# Interface: PrivateAccessor <**DataType**>

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

###  read

• **read**: *function*

*Defined in [packages/contractkit/src/identity/offchain/accessors/interfaces.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/interfaces.ts#L12)*

#### Type declaration:

▸ (`from`: string): *Promise‹DataType›*

**Parameters:**

Name | Type |
------ | ------ |
`from` | string |

___

###  readAsResult

• **readAsResult**: *function*

*Defined in [packages/contractkit/src/identity/offchain/accessors/interfaces.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/interfaces.ts#L13)*

#### Type declaration:

▸ (`from`: string): *Promise‹Result‹DataType, [SchemaErrors](../modules/_identity_offchain_accessors_errors_.md#schemaerrors)››*

**Parameters:**

Name | Type |
------ | ------ |
`from` | string |

___

###  write

• **write**: *function*

*Defined in [packages/contractkit/src/identity/offchain/accessors/interfaces.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/interfaces.ts#L11)*

#### Type declaration:

▸ (`data`: DataType, `to`: string[], `symmetricKey?`: Buffer): *Promise‹[SchemaErrors](../modules/_identity_offchain_accessors_errors_.md#schemaerrors) | void›*

**Parameters:**

Name | Type |
------ | ------ |
`data` | DataType |
`to` | string[] |
`symmetricKey?` | Buffer |
