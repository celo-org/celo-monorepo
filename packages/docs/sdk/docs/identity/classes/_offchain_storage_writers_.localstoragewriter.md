[@celo/identity](../README.md) › ["offchain/storage-writers"](../modules/_offchain_storage_writers_.md) › [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md)

# Class: LocalStorageWriter

## Hierarchy

* [StorageWriter](_offchain_storage_writers_.storagewriter.md)

  ↳ **LocalStorageWriter**

  ↳ [GitStorageWriter](_offchain_storage_writers_.gitstoragewriter.md)

  ↳ [GoogleStorageWriter](_offchain_storage_writers_.googlestoragewriter.md)

  ↳ [AwsStorageWriter](_offchain_storage_writers_.awsstoragewriter.md)

  ↳ [MockStorageWriter](_offchain_storage_writers_.mockstoragewriter.md)

## Index

### Constructors

* [constructor](_offchain_storage_writers_.localstoragewriter.md#constructor)

### Properties

* [root](_offchain_storage_writers_.localstoragewriter.md#readonly-root)

### Methods

* [write](_offchain_storage_writers_.localstoragewriter.md#write)

## Constructors

###  constructor

\+ **new LocalStorageWriter**(`root`: string): *[LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`root` | string |

**Returns:** *[LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md)*

## Properties

### `Readonly` root

• **root**: *string*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L11)*

## Methods

###  write

▸ **write**(`data`: Buffer, `dataPath`: string): *Promise‹void›*

*Overrides [StorageWriter](_offchain_storage_writers_.storagewriter.md).[write](_offchain_storage_writers_.storagewriter.md#abstract-write)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`dataPath` | string |

**Returns:** *Promise‹void›*
