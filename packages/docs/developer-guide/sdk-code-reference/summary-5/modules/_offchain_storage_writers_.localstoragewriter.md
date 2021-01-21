# LocalStorageWriter

## Hierarchy

* [StorageWriter]()

  ↳ **LocalStorageWriter**

  ↳ [GitStorageWriter]()

  ↳ [GoogleStorageWriter]()

  ↳ [MockStorageWriter]()

## Index

### Constructors

* [constructor]()

### Properties

* [root]()

### Methods

* [write]()

## Constructors

### constructor

+ **new LocalStorageWriter**\(`root`: string\): [_LocalStorageWriter_]()

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L12)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `root` | string |

**Returns:** [_LocalStorageWriter_]()

## Properties

### `Readonly` root

• **root**: _string_

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L13)

## Methods

### write

▸ **write**\(`data`: Buffer, `dataPath`: string\): _Promise‹void›_

_Overrides_ [_StorageWriter_]()_._[_write_]()

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L16)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |
| `dataPath` | string |

**Returns:** _Promise‹void›_

