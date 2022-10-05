[@celo/identity](../README.md) › ["offchain/storage-writers"](../modules/_offchain_storage_writers_.md) › [MockStorageWriter](_offchain_storage_writers_.mockstoragewriter.md)

# Class: MockStorageWriter

## Hierarchy

  ↳ [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md)

  ↳ **MockStorageWriter**

## Index

### Constructors

* [constructor](_offchain_storage_writers_.mockstoragewriter.md#constructor)

### Properties

* [fetchMock](_offchain_storage_writers_.mockstoragewriter.md#readonly-fetchmock)
* [mockedStorageRoot](_offchain_storage_writers_.mockstoragewriter.md#readonly-mockedstorageroot)
* [root](_offchain_storage_writers_.mockstoragewriter.md#readonly-root)

### Methods

* [write](_offchain_storage_writers_.mockstoragewriter.md#write)

## Constructors

###  constructor

\+ **new MockStorageWriter**(`root`: string, `mockedStorageRoot`: string, `fetchMock`: any): *[MockStorageWriter](_offchain_storage_writers_.mockstoragewriter.md)*

*Overrides [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[constructor](_offchain_storage_writers_.localstoragewriter.md#constructor)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`root` | string |
`mockedStorageRoot` | string |
`fetchMock` | any |

**Returns:** *[MockStorageWriter](_offchain_storage_writers_.mockstoragewriter.md)*

## Properties

### `Readonly` fetchMock

• **fetchMock**: *any*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L70)*

___

### `Readonly` mockedStorageRoot

• **mockedStorageRoot**: *string*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L70)*

___

### `Readonly` root

• **root**: *string*

*Overrides [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[root](_offchain_storage_writers_.localstoragewriter.md#readonly-root)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L70)*

## Methods

###  write

▸ **write**(`data`: Buffer, `dataPath`: string): *Promise‹void›*

*Overrides [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[write](_offchain_storage_writers_.localstoragewriter.md#write)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`dataPath` | string |

**Returns:** *Promise‹void›*
