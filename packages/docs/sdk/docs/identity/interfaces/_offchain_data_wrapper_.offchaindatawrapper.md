[@celo/identity](../README.md) › ["offchain-data-wrapper"](../modules/_offchain_data_wrapper_.md) › [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)

# Interface: OffchainDataWrapper

## Hierarchy

* **OffchainDataWrapper**

## Implemented by

* [BasicDataWrapper](../classes/_offchain_data_wrapper_.basicdatawrapper.md)

## Index

### Properties

* [kit](_offchain_data_wrapper_.offchaindatawrapper.md#kit)
* [self](_offchain_data_wrapper_.offchaindatawrapper.md#self)
* [signer](_offchain_data_wrapper_.offchaindatawrapper.md#signer)

### Methods

* [readDataFromAsResult](_offchain_data_wrapper_.offchaindatawrapper.md#readdatafromasresult)
* [writeDataTo](_offchain_data_wrapper_.offchaindatawrapper.md#writedatato)

## Properties

###  kit

• **kit**: *ContractKit*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L57)*

___

###  self

• **self**: *Address*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L59)*

___

###  signer

• **signer**: *Address*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L58)*

## Methods

###  readDataFromAsResult

▸ **readDataFromAsResult**<**DataType**>(`account`: Address, `dataPath`: string, `checkOffchainSigners`: boolean, `type?`: t.Type‹DataType›): *Promise‹Result‹Buffer, [OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors)››*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L61)*

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

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L60)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`signature` | Buffer |
`dataPath` | string |

**Returns:** *Promise‹[OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors) | void›*
