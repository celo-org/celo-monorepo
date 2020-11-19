# Class: GoogleStorageWriter

## Hierarchy

  ↳ [LocalStorageWriter](_identity_offchain_storage_writers_.localstoragewriter.md)

  ↳ **GoogleStorageWriter**

## Index

### Constructors

* [constructor](_identity_offchain_storage_writers_.googlestoragewriter.md#constructor)

### Properties

* [local](_identity_offchain_storage_writers_.googlestoragewriter.md#local)
* [root](_identity_offchain_storage_writers_.googlestoragewriter.md#root)

### Methods

* [write](_identity_offchain_storage_writers_.googlestoragewriter.md#write)

## Constructors

###  constructor

\+ **new GoogleStorageWriter**(`local`: string, `bucket`: string): *[GoogleStorageWriter](_identity_offchain_storage_writers_.googlestoragewriter.md)*

*Overrides [LocalStorageWriter](_identity_offchain_storage_writers_.localstoragewriter.md).[constructor](_identity_offchain_storage_writers_.localstoragewriter.md#constructor)*

*Defined in [packages/contractkit/src/identity/offchain/storage-writers.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`local` | string |
`bucket` | string |

**Returns:** *[GoogleStorageWriter](_identity_offchain_storage_writers_.googlestoragewriter.md)*

## Properties

###  local

• **local**: *string*

*Defined in [packages/contractkit/src/identity/offchain/storage-writers.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L42)*

___

###  root

• **root**: *string*

*Inherited from [LocalStorageWriter](_identity_offchain_storage_writers_.localstoragewriter.md).[root](_identity_offchain_storage_writers_.localstoragewriter.md#root)*

*Defined in [packages/contractkit/src/identity/offchain/storage-writers.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L13)*

## Methods

###  write

▸ **write**(`data`: Buffer, `dataPath`: string): *Promise‹void›*

*Overrides [LocalStorageWriter](_identity_offchain_storage_writers_.localstoragewriter.md).[write](_identity_offchain_storage_writers_.localstoragewriter.md#write)*

*Defined in [packages/contractkit/src/identity/offchain/storage-writers.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`dataPath` | string |

**Returns:** *Promise‹void›*
