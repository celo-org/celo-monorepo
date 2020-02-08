# Class: ContractKit

## Hierarchy

* **ContractKit**

## Index

### Constructors

* [constructor](_kit_.contractkit.md#constructor)

### Properties

* [_web3Contracts](_kit_.contractkit.md#_web3contracts)
* [contracts](_kit_.contractkit.md#contracts)
* [registry](_kit_.contractkit.md#registry)
* [web3](_kit_.contractkit.md#web3)

### Accessors

* [defaultAccount](_kit_.contractkit.md#defaultaccount)
* [defaultFeeCurrency](_kit_.contractkit.md#defaultfeecurrency)
* [gasInflationFactor](_kit_.contractkit.md#gasinflationfactor)

### Methods

* [addAccount](_kit_.contractkit.md#addaccount)
* [getEpochNumberOfBlock](_kit_.contractkit.md#getepochnumberofblock)
* [getFirstBlockNumberForEpoch](_kit_.contractkit.md#getfirstblocknumberforepoch)
* [getLastBlockNumberForEpoch](_kit_.contractkit.md#getlastblocknumberforepoch)
* [getNetworkConfig](_kit_.contractkit.md#getnetworkconfig)
* [getTotalBalance](_kit_.contractkit.md#gettotalbalance)
* [isListening](_kit_.contractkit.md#islistening)
* [isSyncing](_kit_.contractkit.md#issyncing)
* [sendTransaction](_kit_.contractkit.md#sendtransaction)
* [sendTransactionObject](_kit_.contractkit.md#sendtransactionobject)
* [setFeeCurrency](_kit_.contractkit.md#setfeecurrency)

## Constructors

###  constructor

\+ **new ContractKit**(`web3`: Web3): *[ContractKit](_kit_.contractkit.md)*

*Defined in [packages/contractkit/src/kit.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |

**Returns:** *[ContractKit](_kit_.contractkit.md)*

## Properties

###  _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [packages/contractkit/src/kit.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L70)*

factory for core contract's native web3 wrappers

___

###  contracts

• **contracts**: *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [packages/contractkit/src/kit.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L72)*

factory for core contract's kit wrappers

___

###  registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/contractkit/src/kit.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L68)*

core contract's address registry

___

###  web3

• **web3**: *Web3*

*Defined in [packages/contractkit/src/kit.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L75)*

## Accessors

###  defaultAccount

• **get defaultAccount**(): *[Address](../modules/_base_.md#address)*

*Defined in [packages/contractkit/src/kit.ts:167](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L167)*

Default account for generated transactions (eg. tx.from)

**Returns:** *[Address](../modules/_base_.md#address)*

• **set defaultAccount**(`address`: [Address](../modules/_base_.md#address)): *void*

*Defined in [packages/contractkit/src/kit.ts:159](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L159)*

Set default account for generated transactions (eg. tx.from )

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *null | string*

*Defined in [packages/contractkit/src/kit.ts:191](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L191)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use cGold

**Returns:** *null | string*

• **set defaultFeeCurrency**(`address`: [Address](../modules/_base_.md#address) | null): *void*

*Defined in [packages/contractkit/src/kit.ts:187](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L187)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use cGold

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) &#124; null | ERC20 address  |

**Returns:** *void*

___

###  gasInflationFactor

• **get gasInflationFactor**(): *number*

*Defined in [packages/contractkit/src/kit.ts:175](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L175)*

**Returns:** *number*

• **set gasInflationFactor**(`factor`: number): *void*

*Defined in [packages/contractkit/src/kit.ts:171](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L171)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [packages/contractkit/src/kit.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L152)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:282](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L282)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:268](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L268)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:275](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L275)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getNetworkConfig

▸ **getNetworkConfig**(): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

*Defined in [packages/contractkit/src/kit.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L102)*

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

___

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹AccountBalance›*

*Defined in [packages/contractkit/src/kit.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L86)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹AccountBalance›*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [packages/contractkit/src/kit.ts:195](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L195)*

**Returns:** *Promise‹boolean›*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [packages/contractkit/src/kit.ts:199](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L199)*

**Returns:** *Promise‹boolean›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: Tx): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [packages/contractkit/src/kit.ts:211](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L211)*

Send a transaction to celo-blockchain.

Similar to `web3.eth.sendTransaction()` but with following differences:
 - applies kit tx's defaults
 - estimatesGas before sending
 - returns a `TransactionResult` instead of `PromiEvent`

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  sendTransactionObject

▸ **sendTransactionObject**(`txObj`: TransactionObject‹any›, `tx?`: Omit‹Tx, "data"›): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [packages/contractkit/src/kit.ts:230](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L230)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | TransactionObject‹any› |
`tx?` | Omit‹Tx, "data"› |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  setFeeCurrency

▸ **setFeeCurrency**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹void›*

*Defined in [packages/contractkit/src/kit.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L147)*

Set CeloToken to use to pay for gas fees

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | cUsd or cGold  |

**Returns:** *Promise‹void›*
