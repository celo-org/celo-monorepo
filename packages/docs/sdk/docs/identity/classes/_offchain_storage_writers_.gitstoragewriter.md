[@celo/identity](../README.md) › ["offchain/storage-writers"](../modules/_offchain_storage_writers_.md) › [GitStorageWriter](_offchain_storage_writers_.gitstoragewriter.md)

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

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`root` | string |

**Returns:** *[GitStorageWriter](_offchain_storage_writers_.gitstoragewriter.md)*

## Properties

### `Readonly` root

• **root**: *string*

*Inherited from [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[root](_offchain_storage_writers_.localstoragewriter.md#readonly-root)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L11)*

## Methods

###  write

▸ **write**(`data`: Buffer, `dataPath`: string): *Promise‹void›*

*Overrides [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[write](_offchain_storage_writers_.localstoragewriter.md#write)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`dataPath` | string |

**Returns:** *Promise‹void›*
