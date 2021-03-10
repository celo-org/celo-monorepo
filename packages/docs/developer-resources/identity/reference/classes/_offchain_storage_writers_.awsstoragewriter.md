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

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`local` | string |
`bucket` | string |

**Returns:** *[AwsStorageWriter](_offchain_storage_writers_.awsstoragewriter.md)*

## Properties

### `Readonly` local

• **local**: *string*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L58)*

___

### `Readonly` root

• **root**: *string*

*Inherited from [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[root](_offchain_storage_writers_.localstoragewriter.md#readonly-root)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L13)*

## Methods

###  write

▸ **write**(`data`: Buffer, `dataPath`: string): *Promise‹void›*

*Overrides [LocalStorageWriter](_offchain_storage_writers_.localstoragewriter.md).[write](_offchain_storage_writers_.localstoragewriter.md#write)*

*Defined in [packages/sdk/identity/src/offchain/storage-writers.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/storage-writers.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`dataPath` | string |

**Returns:** *Promise‹void›*
