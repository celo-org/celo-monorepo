# LocalStorageWriter

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

* [root](_identity_offchain_storage_writers_.localstoragewriter.md#readonly-root)

### Methods

* [write](_identity_offchain_storage_writers_.localstoragewriter.md#write)

## Constructors

### constructor

+ **new LocalStorageWriter**\(`root`: string\): [_LocalStorageWriter_](_identity_offchain_storage_writers_.localstoragewriter.md)

_Defined in_ [_packages/contractkit/src/identity/offchain/storage-writers.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L12)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `root` | string |

**Returns:** [_LocalStorageWriter_](_identity_offchain_storage_writers_.localstoragewriter.md)

## Properties

### `Readonly` root

• **root**: _string_

_Defined in_ [_packages/contractkit/src/identity/offchain/storage-writers.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L13)

## Methods

### write

▸ **write**\(`data`: Buffer, `dataPath`: string\): _Promise‹void›_

_Overrides_ [_StorageWriter_](_identity_offchain_storage_writers_.storagewriter.md)_._[_write_](_identity_offchain_storage_writers_.storagewriter.md#abstract-write)

_Defined in_ [_packages/contractkit/src/identity/offchain/storage-writers.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L16)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |
| `dataPath` | string |

**Returns:** _Promise‹void›_

