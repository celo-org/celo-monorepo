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

*Defined in [contractkit/src/identity/offchain/storage-writers.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L44)*

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

*Defined in [contractkit/src/identity/offchain/storage-writers.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L45)*

___

###  mockedStorageRoot

• **mockedStorageRoot**: *string*

*Defined in [contractkit/src/identity/offchain/storage-writers.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L45)*

___

###  root

• **root**: *string*

*Overrides [LocalStorageWriter](_identity_offchain_storage_writers_.localstoragewriter.md).[root](_identity_offchain_storage_writers_.localstoragewriter.md#root)*

*Defined in [contractkit/src/identity/offchain/storage-writers.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L45)*

## Methods

###  write

▸ **write**(`data`: string, `dataPath`: string): *Promise‹void›*

*Overrides [LocalStorageWriter](_identity_offchain_storage_writers_.localstoragewriter.md).[write](_identity_offchain_storage_writers_.localstoragewriter.md#write)*

*Defined in [contractkit/src/identity/offchain/storage-writers.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/storage-writers.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |
`dataPath` | string |

**Returns:** *Promise‹void›*
