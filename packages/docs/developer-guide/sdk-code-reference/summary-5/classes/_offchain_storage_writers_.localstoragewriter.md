# LocalStorageWriter

## Hierarchy

* [StorageWriter](_offchain_storage_writers_.storagewriter.md)

  ↳ **LocalStorageWriter**

  ↳ [GitStorageWriter](_offchain_storage_writers_.gitstoragewriter.md)

  ↳ [GoogleStorageWriter](_offchain_storage_writers_.googlestoragewriter.md)

  ↳ [MockStorageWriter](_offchain_storage_writers_.mockstoragewriter.md)

## Index

### Constructors

* [constructor](_offchain_storage_writers_.localstoragewriter.md#constructor)

### Properties

* [root](_offchain_storage_writers_.localstoragewriter.md#readonly-root)

### Methods

* [write](_offchain_storage_writers_.localstoragewriter.md#write)

## Constructors

### constructor

+ **new LocalStorageWriter**\(`root`: string\): [_LocalStorageWriter_](_offchain_storage_writers_.localstoragewriter.md)

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L12)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `root` | string |

**Returns:** [_LocalStorageWriter_](_offchain_storage_writers_.localstoragewriter.md)

## Properties

### `Readonly` root

• **root**: _string_

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L13)

## Methods

### write

▸ **write**\(`data`: Buffer, `dataPath`: string\): _Promise‹void›_

_Overrides_ [_StorageWriter_](_offchain_storage_writers_.storagewriter.md)_._[_write_](_offchain_storage_writers_.storagewriter.md#abstract-write)

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L16)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |
| `dataPath` | string |

**Returns:** _Promise‹void›_

