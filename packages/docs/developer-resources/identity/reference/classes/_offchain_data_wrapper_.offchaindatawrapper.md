# Class: OffchainDataWrapper

## Hierarchy

* **OffchainDataWrapper**

## Index

### Constructors

* [constructor](_offchain_data_wrapper_.offchaindatawrapper.md#constructor)

### Properties

* [kit](_offchain_data_wrapper_.offchaindatawrapper.md#readonly-kit)
* [readDataFrom](_offchain_data_wrapper_.offchaindatawrapper.md#readdatafrom)
* [self](_offchain_data_wrapper_.offchaindatawrapper.md#readonly-self)
* [signer](_offchain_data_wrapper_.offchaindatawrapper.md#signer)
* [storageWriter](_offchain_data_wrapper_.offchaindatawrapper.md#storagewriter)

### Methods

* [readDataFromAsResult](_offchain_data_wrapper_.offchaindatawrapper.md#readdatafromasresult)
* [writeDataTo](_offchain_data_wrapper_.offchaindatawrapper.md#writedatato)

## Constructors

###  constructor

\+ **new OffchainDataWrapper**(`self`: string, `kit`: ContractKit, `signer?`: undefined | string): *[OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`self` | string |
`kit` | ContractKit |
`signer?` | undefined &#124; string |

**Returns:** *[OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)*

## Properties

### `Readonly` kit

• **kit**: *ContractKit*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L58)*

___

###  readDataFrom

• **readDataFrom**: *Object* = makeAsyncThrowable(this.readDataFromAsResult.bind(this))

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L93)*

___

### `Readonly` self

• **self**: *string*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L58)*

___

###  signer

• **signer**: *string*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L56)*

___

###  storageWriter

• **storageWriter**: *[StorageWriter](_offchain_storage_writers_.storagewriter.md) | undefined*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L55)*

## Methods

###  readDataFromAsResult

▸ **readDataFromAsResult**<**DataType**>(`account`: Address, `dataPath`: string, `checkOffchainSigners`: boolean, `type?`: t.Type‹DataType›): *Promise‹Result‹Buffer, [OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors)››*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L62)*

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

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:95](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L95)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`signature` | Buffer |
`dataPath` | string |

**Returns:** *Promise‹[OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors) | void›*
