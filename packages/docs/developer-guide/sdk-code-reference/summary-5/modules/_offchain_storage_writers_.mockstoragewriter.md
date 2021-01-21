# MockStorageWriter

## Hierarchy

↳ [LocalStorageWriter]()

↳ **MockStorageWriter**

## Index

### Constructors

* [constructor]()

### Properties

* [fetchMock]()
* [mockedStorageRoot]()
* [root]()

### Methods

* [write]()

## Constructors

### constructor

+ **new MockStorageWriter**\(`root`: string, `mockedStorageRoot`: string, `fetchMock`: any\): [_MockStorageWriter_]()

_Overrides_ [_LocalStorageWriter_]()_._[_constructor_]()

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L55)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `root` | string |
| `mockedStorageRoot` | string |
| `fetchMock` | any |

**Returns:** [_MockStorageWriter_]()

## Properties

### `Readonly` fetchMock

• **fetchMock**: _any_

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L56)

### `Readonly` mockedStorageRoot

• **mockedStorageRoot**: _string_

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L56)

### `Readonly` root

• **root**: _string_

_Overrides_ [_LocalStorageWriter_]()_._[_root_]()

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L56)

## Methods

### write

▸ **write**\(`data`: Buffer, `dataPath`: string\): _Promise‹void›_

_Overrides_ [_LocalStorageWriter_]()_._[_write_]()

_Defined in_ [_packages/sdk/identity/src/offchain/storage-writers.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L59)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |
| `dataPath` | string |

**Returns:** _Promise‹void›_

