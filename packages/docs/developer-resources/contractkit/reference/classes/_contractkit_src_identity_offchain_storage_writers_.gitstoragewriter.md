# Class: GitStorageWriter

## Hierarchy

  ↳ [LocalStorageWriter](_contractkit_src_identity_offchain_storage_writers_.localstoragewriter.md)

  ↳ **GitStorageWriter**

## Index

### Constructors

* [constructor](_contractkit_src_identity_offchain_storage_writers_.gitstoragewriter.md#constructor)

### Properties

* [root](_contractkit_src_identity_offchain_storage_writers_.gitstoragewriter.md#root)

### Methods

* [write](_contractkit_src_identity_offchain_storage_writers_.gitstoragewriter.md#write)

## Constructors

###  constructor

\+ **new GitStorageWriter**(`root`: string): *[GitStorageWriter](_contractkit_src_identity_offchain_storage_writers_.gitstoragewriter.md)*

*Inherited from [LocalStorageWriter](_contractkit_src_identity_offchain_storage_writers_.localstoragewriter.md).[constructor](_contractkit_src_identity_offchain_storage_writers_.localstoragewriter.md#constructor)*

*Defined in [contractkit/src/identity/offchain/storage-writers.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`root` | string |

**Returns:** *[GitStorageWriter](_contractkit_src_identity_offchain_storage_writers_.gitstoragewriter.md)*

## Properties

###  root

• **root**: *string*

*Inherited from [LocalStorageWriter](_contractkit_src_identity_offchain_storage_writers_.localstoragewriter.md).[root](_contractkit_src_identity_offchain_storage_writers_.localstoragewriter.md#root)*

*Defined in [contractkit/src/identity/offchain/storage-writers.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L10)*

## Methods

###  write

▸ **write**(`data`: string, `dataPath`: string): *Promise‹void›*

*Overrides [LocalStorageWriter](_contractkit_src_identity_offchain_storage_writers_.localstoragewriter.md).[write](_contractkit_src_identity_offchain_storage_writers_.localstoragewriter.md#write)*

*Defined in [contractkit/src/identity/offchain/storage-writers.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |
`dataPath` | string |

**Returns:** *Promise‹void›*
