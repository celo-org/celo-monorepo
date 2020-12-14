# MockStorageWriter

## Hierarchy

↳ [LocalStorageWriter](_identity_offchain_storage_writers_.localstoragewriter.md)

↳ **MockStorageWriter**

## Index

### Constructors

* [constructor](_identity_offchain_storage_writers_.mockstoragewriter.md#constructor)

### Properties

* [fetchMock](_identity_offchain_storage_writers_.mockstoragewriter.md#readonly-fetchmock)
* [mockedStorageRoot](_identity_offchain_storage_writers_.mockstoragewriter.md#readonly-mockedstorageroot)
* [root](_identity_offchain_storage_writers_.mockstoragewriter.md#readonly-root)

### Methods

* [write](_identity_offchain_storage_writers_.mockstoragewriter.md#write)

## Constructors

### constructor

+ **new MockStorageWriter**\(`root`: string, `mockedStorageRoot`: string, `fetchMock`: any\): [_MockStorageWriter_](_identity_offchain_storage_writers_.mockstoragewriter.md)

_Overrides_ [_LocalStorageWriter_](_identity_offchain_storage_writers_.localstoragewriter.md)_._[_constructor_](_identity_offchain_storage_writers_.localstoragewriter.md#constructor)

_Defined in_ [_packages/contractkit/src/identity/offchain/storage-writers.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L55)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `root` | string |
| `mockedStorageRoot` | string |
| `fetchMock` | any |

**Returns:** [_MockStorageWriter_](_identity_offchain_storage_writers_.mockstoragewriter.md)

## Properties

### `Readonly` fetchMock

• **fetchMock**: _any_

_Defined in_ [_packages/contractkit/src/identity/offchain/storage-writers.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L56)

### `Readonly` mockedStorageRoot

• **mockedStorageRoot**: _string_

_Defined in_ [_packages/contractkit/src/identity/offchain/storage-writers.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L56)

### `Readonly` root

• **root**: _string_

_Overrides_ [_LocalStorageWriter_](_identity_offchain_storage_writers_.localstoragewriter.md)_._[_root_](_identity_offchain_storage_writers_.localstoragewriter.md#readonly-root)

_Defined in_ [_packages/contractkit/src/identity/offchain/storage-writers.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L56)

## Methods

### write

▸ **write**\(`data`: Buffer, `dataPath`: string\): _Promise‹void›_

_Overrides_ [_LocalStorageWriter_](_identity_offchain_storage_writers_.localstoragewriter.md)_._[_write_](_identity_offchain_storage_writers_.localstoragewriter.md#write)

_Defined in_ [_packages/contractkit/src/identity/offchain/storage-writers.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L59)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |
| `dataPath` | string |

**Returns:** _Promise‹void›_

