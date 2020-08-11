# Class: LocalStorageWriter

## Hierarchy

* [StorageWriter](_contractkit_src_identity_offchain_storage_writers_.storagewriter.md)

  ↳ **LocalStorageWriter**

  ↳ [GitStorageWriter](_contractkit_src_identity_offchain_storage_writers_.gitstoragewriter.md)

  ↳ [MockStorageWriter](_contractkit_src_identity_offchain_storage_writers_.mockstoragewriter.md)

## Index

### Constructors

* [constructor](_contractkit_src_identity_offchain_storage_writers_.localstoragewriter.md#constructor)

### Properties

* [root](_contractkit_src_identity_offchain_storage_writers_.localstoragewriter.md#root)

### Methods

* [write](_contractkit_src_identity_offchain_storage_writers_.localstoragewriter.md#write)

## Constructors

###  constructor

\+ **new LocalStorageWriter**(`root`: string): *[LocalStorageWriter](_contractkit_src_identity_offchain_storage_writers_.localstoragewriter.md)*

*Defined in [contractkit/src/identity/offchain/storage-writers.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`root` | string |

**Returns:** *[LocalStorageWriter](_contractkit_src_identity_offchain_storage_writers_.localstoragewriter.md)*

## Properties

###  root

• **root**: *string*

*Defined in [contractkit/src/identity/offchain/storage-writers.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L10)*

## Methods

###  write

▸ **write**(`data`: string, `dataPath`: string): *Promise‹void›*

*Overrides [StorageWriter](_contractkit_src_identity_offchain_storage_writers_.storagewriter.md).[write](_contractkit_src_identity_offchain_storage_writers_.storagewriter.md#abstract-write)*

*Defined in [contractkit/src/identity/offchain/storage-writers.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |
`dataPath` | string |

**Returns:** *Promise‹void›*
