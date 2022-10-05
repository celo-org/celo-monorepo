[@celo/identity](../README.md) › ["offchain-data-wrapper"](../modules/_offchain_data_wrapper_.md) › [BasicDataWrapper](_offchain_data_wrapper_.basicdatawrapper.md)

# Class: BasicDataWrapper

## Hierarchy

* **BasicDataWrapper**

## Implements

* [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md)

## Index

### Constructors

* [constructor](_offchain_data_wrapper_.basicdatawrapper.md#constructor)

### Properties

* [kit](_offchain_data_wrapper_.basicdatawrapper.md#readonly-kit)
* [readDataFrom](_offchain_data_wrapper_.basicdatawrapper.md#readdatafrom)
* [self](_offchain_data_wrapper_.basicdatawrapper.md#readonly-self)
* [signer](_offchain_data_wrapper_.basicdatawrapper.md#signer)
* [storageWriter](_offchain_data_wrapper_.basicdatawrapper.md#storagewriter)

### Methods

* [readDataFromAsResult](_offchain_data_wrapper_.basicdatawrapper.md#readdatafromasresult)
* [writeDataTo](_offchain_data_wrapper_.basicdatawrapper.md#writedatato)

## Constructors

###  constructor

\+ **new BasicDataWrapper**(`self`: string, `kit`: ContractKit, `signer?`: undefined | string): *[BasicDataWrapper](_offchain_data_wrapper_.basicdatawrapper.md)*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`self` | string |
`kit` | ContractKit |
`signer?` | undefined &#124; string |

**Returns:** *[BasicDataWrapper](_offchain_data_wrapper_.basicdatawrapper.md)*

## Properties

### `Readonly` kit

• **kit**: *ContractKit*

*Implementation of [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md).[kit](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md#kit)*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L77)*

___

###  readDataFrom

• **readDataFrom**: *Object* = makeAsyncThrowable(this.readDataFromAsResult.bind(this))

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:112](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L112)*

___

### `Readonly` self

• **self**: *string*

*Implementation of [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md).[self](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md#self)*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L77)*

___

###  signer

• **signer**: *string*

*Implementation of [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md).[signer](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md#signer)*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L75)*

___

###  storageWriter

• **storageWriter**: *[StorageWriter](_offchain_storage_writers_.storagewriter.md) | undefined*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L74)*

## Methods

###  readDataFromAsResult

▸ **readDataFromAsResult**<**DataType**>(`account`: Address, `dataPath`: string, `checkOffchainSigners`: boolean, `type?`: t.Type‹DataType›): *Promise‹Result‹Buffer, [OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors)››*

*Implementation of [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L81)*

**Type parameters:**

▪ **DataType**

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |
`dataPath` | string |
`checkOffchainSigners` | boolean |
`type?` | t.Type‹DataType› |

**Returns:** *Promise‹Result‹Buffer, [OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors)››*

___

###  writeDataTo

▸ **writeDataTo**(`data`: Buffer, `signature`: Buffer, `dataPath`: string): *Promise‹[OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors) | void›*

*Implementation of [OffchainDataWrapper](../interfaces/_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L114)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`signature` | Buffer |
`dataPath` | string |

**Returns:** *Promise‹[OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors) | void›*
