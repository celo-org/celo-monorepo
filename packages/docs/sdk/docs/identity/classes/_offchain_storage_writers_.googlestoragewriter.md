[@celo/identity](../README.md) › ["offchain/storage-writers"](../modules/_offchain_storage_writers_.md) › [GoogleStorageWriter](_offchain_storage_writers_.googlestoragewriter.md)

# Class: GoogleStorageWriter

## Hierarchy

  ↳ [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md)

  ↳ **GoogleStorageWriter**

## Index

### Constructors

* [constructor](_offchain_storage_writers_.googlestoragewriter.md#constructor)

### Properties

* [local](_offchain_storage_writers_.googlestoragewriter.md#readonly-local)
* [root](_offchain_storage_writers_.googlestoragewriter.md#readonly-root)

### Methods

* [write](_offchain_storage_writers_.googlestoragewriter.md#write)

## Constructors

###  constructor

\+ **new GoogleStorageWriter**(`local`: string, `bucket`: string): *[GoogleStorageWriter](_offchain_storage_writers_.googlestoragewriter.md)*

*Overrides [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[constructor](_offchain_storage_writers_.localstoragewriter.md#constructor)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`local` | string |
`bucket` | string |

**Returns:** *[GoogleStorageWriter](_offchain_storage_writers_.googlestoragewriter.md)*

## Properties

### `Readonly` local

• **local**: *string*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L40)*

___

### `Readonly` root

• **root**: *string*

*Inherited from [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[root](_offchain_storage_writers_.localstoragewriter.md#readonly-root)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L11)*

## Methods

###  write

▸ **write**(`data`: Buffer, `dataPath`: string): *Promise‹void›*

*Overrides [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[write](_offchain_storage_writers_.localstoragewriter.md#write)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`dataPath` | string |

**Returns:** *Promise‹void›*
