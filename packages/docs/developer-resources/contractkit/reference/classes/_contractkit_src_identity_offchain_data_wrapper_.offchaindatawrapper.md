# Class: OffchainDataWrapper

## Hierarchy

* **OffchainDataWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md#constructor)

### Properties

* [kit](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md#kit)
* [self](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md#self)
* [storageWriter](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md#storagewriter)

### Methods

* [readDataFrom](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md#readdatafrom)
* [writeDataTo](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md#writedatato)

## Constructors

###  constructor

\+ **new OffchainDataWrapper**(`self`: string, `kit`: [ContractKit](_contractkit_src_kit_.contractkit.md)): *[OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [contractkit/src/identity/offchain-data-wrapper.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain-data-wrapper.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`self` | string |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |

**Returns:** *[OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

## Properties

###  kit

• **kit**: *[ContractKit](_contractkit_src_kit_.contractkit.md)*

*Defined in [contractkit/src/identity/offchain-data-wrapper.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain-data-wrapper.ts#L14)*

___

###  self

• **self**: *string*

*Defined in [contractkit/src/identity/offchain-data-wrapper.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain-data-wrapper.ts#L14)*

___

###  storageWriter

• **storageWriter**: *[StorageWriter](_contractkit_src_identity_offchain_storage_writers_.storagewriter.md) | undefined*

*Defined in [contractkit/src/identity/offchain-data-wrapper.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain-data-wrapper.ts#L12)*

## Methods

###  readDataFrom

▸ **readDataFrom**(`account`: string, `dataPath`: string): *Promise‹any›*

*Defined in [contractkit/src/identity/offchain-data-wrapper.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain-data-wrapper.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |
`dataPath` | string |

**Returns:** *Promise‹any›*

___

###  writeDataTo

▸ **writeDataTo**(`data`: string, `dataPath`: string): *Promise‹void›*

*Defined in [contractkit/src/identity/offchain-data-wrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain-data-wrapper.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |
`dataPath` | string |

**Returns:** *Promise‹void›*
