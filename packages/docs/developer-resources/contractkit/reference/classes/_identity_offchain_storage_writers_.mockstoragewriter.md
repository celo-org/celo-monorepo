# Class: MockStorageWriter

## Hierarchy

  ↳ [LocalStorageWriter](_identity_offchain_storage_writers_.localstoragewriter.md)

  ↳ **MockStorageWriter**

## Index

### Constructors

* [constructor](_identity_offchain_storage_writers_.mockstoragewriter.md#constructor)

### Properties

* [fetchMock](_identity_offchain_storage_writers_.mockstoragewriter.md#fetchmock)
* [mockedStorageRoot](_identity_offchain_storage_writers_.mockstoragewriter.md#mockedstorageroot)
* [root](_identity_offchain_storage_writers_.mockstoragewriter.md#root)

### Methods

* [write](_identity_offchain_storage_writers_.mockstoragewriter.md#write)

## Constructors

###  constructor

\+ **new MockStorageWriter**(`root`: string, `mockedStorageRoot`: string, `fetchMock`: any): *[MockStorageWriter](_identity_offchain_storage_writers_.mockstoragewriter.md)*

*Overrides [LocalStorageWriter](_identity_offchain_storage_writers_.localstoragewriter.md).[constructor](_identity_offchain_storage_writers_.localstoragewriter.md#constructor)*

*Defined in [packages/contractkit/src/identity/offchain/storage-writers.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`root` | string |
`mockedStorageRoot` | string |
`fetchMock` | any |

**Returns:** *[MockStorageWriter](_identity_offchain_storage_writers_.mockstoragewriter.md)*

## Properties

###  fetchMock

• **fetchMock**: *any*

*Defined in [packages/contractkit/src/identity/offchain/storage-writers.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L56)*

___

###  mockedStorageRoot

• **mockedStorageRoot**: *string*

*Defined in [packages/contractkit/src/identity/offchain/storage-writers.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L56)*

___

###  root

• **root**: *string*

*Overrides [LocalStorageWriter](_identity_offchain_storage_writers_.localstoragewriter.md).[root](_identity_offchain_storage_writers_.localstoragewriter.md#root)*

*Defined in [packages/contractkit/src/identity/offchain/storage-writers.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L56)*

## Methods

###  write

▸ **write**(`data`: Buffer, `dataPath`: string): *Promise‹void›*

*Overrides [LocalStorageWriter](_identity_offchain_storage_writers_.localstoragewriter.md).[write](_identity_offchain_storage_writers_.localstoragewriter.md#write)*

*Defined in [packages/contractkit/src/identity/offchain/storage-writers.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`dataPath` | string |

**Returns:** *Promise‹void›*
