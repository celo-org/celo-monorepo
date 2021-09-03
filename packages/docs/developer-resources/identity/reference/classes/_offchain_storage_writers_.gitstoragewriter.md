# Class: GitStorageWriter

## Hierarchy

  ↳ [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md)

  ↳ **GitStorageWriter**

## Index

### Constructors

* [constructor](_offchain_storage_writers_.gitstoragewriter.md#constructor)

### Properties

* [root](_offchain_storage_writers_.gitstoragewriter.md#readonly-root)

### Methods

* [write](_offchain_storage_writers_.gitstoragewriter.md#write)

## Constructors

###  constructor

\+ **new GitStorageWriter**(`root`: string): *[GitStorageWriter](_offchain_storage_writers_.gitstoragewriter.md)*

*Inherited from [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[constructor](_offchain_storage_writers_.localstoragewriter.md#constructor)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`root` | string |

**Returns:** *[GitStorageWriter](_offchain_storage_writers_.gitstoragewriter.md)*

## Properties

### `Readonly` root

• **root**: *string*

*Inherited from [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[root](_offchain_storage_writers_.localstoragewriter.md#readonly-root)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L13)*

## Methods

###  write

▸ **write**(`data`: Buffer, `dataPath`: string): *Promise‹void›*

*Overrides [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[write](_offchain_storage_writers_.localstoragewriter.md#write)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`dataPath` | string |

**Returns:** *Promise‹void›*
