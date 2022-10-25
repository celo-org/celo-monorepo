[@celo/identity](../README.md) › ["offchain/storage-writers"](../modules/_offchain_storage_writers_.md) › [AwsStorageWriter](_offchain_storage_writers_.awsstoragewriter.md)

# Class: AwsStorageWriter

## Hierarchy

  ↳ [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md)

  ↳ **AwsStorageWriter**

## Index

### Constructors

* [constructor](_offchain_storage_writers_.awsstoragewriter.md#constructor)

### Properties

* [local](_offchain_storage_writers_.awsstoragewriter.md#readonly-local)
* [root](_offchain_storage_writers_.awsstoragewriter.md#readonly-root)

### Methods

* [write](_offchain_storage_writers_.awsstoragewriter.md#write)

## Constructors

###  constructor

\+ **new AwsStorageWriter**(`local`: string, `bucket`: string): *[AwsStorageWriter](_offchain_storage_writers_.awsstoragewriter.md)*

*Overrides [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[constructor](_offchain_storage_writers_.localstoragewriter.md#constructor)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`local` | string |
`bucket` | string |

**Returns:** *[AwsStorageWriter](_offchain_storage_writers_.awsstoragewriter.md)*

## Properties

### `Readonly` local

• **local**: *string*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L55)*

___

### `Readonly` root

• **root**: *string*

*Inherited from [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[root](_offchain_storage_writers_.localstoragewriter.md#readonly-root)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L10)*

## Methods

###  write

▸ **write**(`data`: Buffer, `dataPath`: string): *Promise‹void›*

*Overrides [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[write](_offchain_storage_writers_.localstoragewriter.md#write)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L60)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`dataPath` | string |

**Returns:** *Promise‹void›*
