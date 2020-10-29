# Class: LocalStorageWriter

## Hierarchy

* [StorageWriter](_identity_offchain_storage_writers_.storagewriter.md)

  ↳ **LocalStorageWriter**

  ↳ [GitStorageWriter](_identity_offchain_storage_writers_.gitstoragewriter.md)

  ↳ [GoogleStorageWriter](_identity_offchain_storage_writers_.googlestoragewriter.md)

  ↳ [MockStorageWriter](_identity_offchain_storage_writers_.mockstoragewriter.md)

## Index

### Constructors

* [constructor](_identity_offchain_storage_writers_.localstoragewriter.md#constructor)

### Properties

* [root](_identity_offchain_storage_writers_.localstoragewriter.md#root)

### Methods

* [write](_identity_offchain_storage_writers_.localstoragewriter.md#write)

## Constructors

###  constructor

\+ **new LocalStorageWriter**(`root`: string): *[LocalStorageWriter](_identity_offchain_storage_writers_.localstoragewriter.md)*

*Defined in [packages/contractkit/src/identity/offchain/storage-writers.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`root` | string |

**Returns:** *[LocalStorageWriter](_identity_offchain_storage_writers_.localstoragewriter.md)*

## Properties

###  root

• **root**: *string*

*Defined in [packages/contractkit/src/identity/offchain/storage-writers.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L13)*

## Methods

###  write

▸ **write**(`data`: Buffer, `dataPath`: string): *Promise‹void›*

*Overrides [StorageWriter](_identity_offchain_storage_writers_.storagewriter.md).[write](_identity_offchain_storage_writers_.storagewriter.md#abstract-write)*

*Defined in [packages/contractkit/src/identity/offchain/storage-writers.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`dataPath` | string |

**Returns:** *Promise‹void›*
