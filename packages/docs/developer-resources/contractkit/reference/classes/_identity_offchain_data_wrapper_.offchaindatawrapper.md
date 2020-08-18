# Class: OffchainDataWrapper

## Hierarchy

* **OffchainDataWrapper**

## Index

### Constructors

* [constructor](_identity_offchain_data_wrapper_.offchaindatawrapper.md#constructor)

### Properties

* [kit](_identity_offchain_data_wrapper_.offchaindatawrapper.md#kit)
* [self](_identity_offchain_data_wrapper_.offchaindatawrapper.md#self)
* [storageWriter](_identity_offchain_data_wrapper_.offchaindatawrapper.md#storagewriter)

### Methods

* [readDataFrom](_identity_offchain_data_wrapper_.offchaindatawrapper.md#readdatafrom)
* [writeDataTo](_identity_offchain_data_wrapper_.offchaindatawrapper.md#writedatato)

## Constructors

###  constructor

\+ **new OffchainDataWrapper**(`self`: string, `kit`: [ContractKit](_kit_.contractkit.md)): *[OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/contractkit/src/identity/offchain-data-wrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain-data-wrapper.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`self` | string |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *[OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

## Properties

###  kit

• **kit**: *[ContractKit](_kit_.contractkit.md)*

*Defined in [packages/contractkit/src/identity/offchain-data-wrapper.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain-data-wrapper.ts#L35)*

___

###  self

• **self**: *string*

*Defined in [packages/contractkit/src/identity/offchain-data-wrapper.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain-data-wrapper.ts#L35)*

___

###  storageWriter

• **storageWriter**: *[StorageWriter](_identity_offchain_storage_writers_.storagewriter.md) | undefined*

*Defined in [packages/contractkit/src/identity/offchain-data-wrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain-data-wrapper.ts#L33)*

## Methods

###  readDataFrom

▸ **readDataFrom**(`account`: string, `dataPath`: string): *Promise‹[Task](../modules/_identity_task_.md#task)‹string, [OffchainErrors](../modules/_identity_offchain_data_wrapper_.md#offchainerrors)››*

*Defined in [packages/contractkit/src/identity/offchain-data-wrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain-data-wrapper.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |
`dataPath` | string |

**Returns:** *Promise‹[Task](../modules/_identity_task_.md#task)‹string, [OffchainErrors](../modules/_identity_offchain_data_wrapper_.md#offchainerrors)››*

___

###  writeDataTo

▸ **writeDataTo**(`data`: string, `dataPath`: string): *Promise‹void›*

*Defined in [packages/contractkit/src/identity/offchain-data-wrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain-data-wrapper.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |
`dataPath` | string |

**Returns:** *Promise‹void›*
