# GitStorageWriter

## Hierarchy

↳ [LocalStorageWriter]()

↳ **GitStorageWriter**

## Index

### Constructors

* [constructor]()

### Properties

* [root]()

### Methods

* [write]()

## Constructors

### constructor

+ **new GitStorageWriter**\(`root`: string\): [_GitStorageWriter_]()

_Inherited from_ [_LocalStorageWriter_]()_._[_constructor_]()

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L12)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `root` | string |

**Returns:** [_GitStorageWriter_]()

## Properties

### `Readonly` root

• **root**: _string_

_Inherited from_ [_LocalStorageWriter_]()_._[_root_]()

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L13)

## Methods

### write

▸ **write**\(`data`: Buffer, `dataPath`: string\): _Promise‹void›_

_Overrides_ [_LocalStorageWriter_]()_._[_write_]()

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L28)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |
| `dataPath` | string |

**Returns:** _Promise‹void›_

