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
* [stop](_kit_.contractkit.md#stop)

## Constructors

###  constructor

\+ **new ContractKit**(`web3`: Web3): *[ContractKit](_kit_.contractkit.md)*

*Defined in [contractkit/src/kit.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L87)*

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |

**Returns:** *[ContractKit](_kit_.contractkit.md)*

## Properties

###  _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [contractkit/src/kit.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L83)*

factory for core contract's native web3 wrappers

___

###  contracts

• **contracts**: *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [contractkit/src/kit.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L85)*

factory for core contract's kit wrappers

___

###  registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [contractkit/src/kit.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L81)*

core contract's address registry

___

###  web3

• **web3**: *Web3*

*Defined in [contractkit/src/kit.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L88)*

## Accessors

###  defaultAccount

• **get defaultAccount**(): *[Address](../modules/_base_.md#address) | null*

*Defined in [contractkit/src/kit.ts:197](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L197)*

Default account for generated transactions (eg. tx.from)

**Returns:** *[Address](../modules/_base_.md#address) | null*

• **set defaultAccount**(`address`: [Address](../modules/_base_.md#address) | null): *void*

*Defined in [contractkit/src/kit.ts:189](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L189)*

Set default account for generated transactions (eg. tx.from )

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) &#124; null |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *null | string*

*Defined in [contractkit/src/kit.ts:221](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L221)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use cGLD

**Returns:** *null | string*

• **set defaultFeeCurrency**(`address`: [Address](../modules/_base_.md#address) | null): *void*

*Defined in [contractkit/src/kit.ts:217](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L217)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use cGLD

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) &#124; null | ERC20 address  |

**Returns:** *void*

___

###  gasInflationFactor

• **get gasInflationFactor**(): *number*

*Defined in [contractkit/src/kit.ts:205](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L205)*

**Returns:** *number*

• **set gasInflationFactor**(`factor`: number): *void*

*Defined in [contractkit/src/kit.ts:201](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L201)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [contractkit/src/kit.ts:181](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L181)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:319](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L319)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:297](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L297)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:308](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L308)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getNetworkConfig

▸ **getNetworkConfig**(): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

*Defined in [contractkit/src/kit.ts:131](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L131)*

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

___

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹AccountBalance›*

*Defined in [contractkit/src/kit.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L105)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹AccountBalance›*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [contractkit/src/kit.ts:225](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L225)*

**Returns:** *Promise‹boolean›*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean | Syncing›*

*Defined in [contractkit/src/kit.ts:229](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L229)*

**Returns:** *Promise‹boolean | Syncing›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: Tx): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [contractkit/src/kit.ts:241](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L241)*

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

*Defined in [contractkit/src/kit.ts:260](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L260)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | TransactionObject‹any› |
`tx?` | Omit‹Tx, "data"› |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  setFeeCurrency

▸ **setFeeCurrency**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹void›*

*Defined in [contractkit/src/kit.ts:176](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L176)*

Set CeloToken to use to pay for gas fees

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | cUSD (StableToken) or cGLD (GoldToken)  |

**Returns:** *Promise‹void›*

___

###  stop

▸ **stop**(): *void*

*Defined in [contractkit/src/kit.ts:331](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L331)*

**Returns:** *void*
