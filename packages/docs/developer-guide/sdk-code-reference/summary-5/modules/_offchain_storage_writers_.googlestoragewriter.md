# GoogleStorageWriter

## Hierarchy

↳ [LocalStorageWriter]()

↳ **GoogleStorageWriter**

## Index

### Constructors

* [constructor]()

### Properties

* [local]()
* [root]()

### Methods

* [write]()

## Constructors

### constructor

+ **new GoogleStorageWriter**\(`local`: string, `bucket`: string\): [_GoogleStorageWriter_]()

_Overrides_ [_LocalStorageWriter_]()_._[_constructor_]()

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L40)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `local` | string |
| `bucket` | string |

**Returns:** [_GoogleStorageWriter_]()

## Properties

### `Readonly` local

• **local**: _string_

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L42)

### `Readonly` root

• **root**: _string_

_Inherited from_ [_LocalStorageWriter_]()_._[_root_]()

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L13)

## Methods

### write

▸ **write**\(`data`: Buffer, `dataPath`: string\): _Promise‹void›_

_Overrides_ [_LocalStorageWriter_]()_._[_write_]()

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L47)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |
| `dataPath` | string |

**Returns:** _Promise‹void›_

