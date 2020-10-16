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
* [gasPrice](_kit_.contractkit.md#gasprice)

### Methods

* [addAccount](_kit_.contractkit.md#addaccount)
* [fillGasPrice](_kit_.contractkit.md#fillgasprice)
* [getEpochNumberOfBlock](_kit_.contractkit.md#getepochnumberofblock)
* [getEpochSize](_kit_.contractkit.md#getepochsize)
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

\+ **new ContractKit**(`web3`: Web3, `wallet?`: [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)): *[ContractKit](_kit_.contractkit.md)*

*Defined in [packages/contractkit/src/kit.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |
`wallet?` | [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md) |

**Returns:** *[ContractKit](_kit_.contractkit.md)*

## Properties

###  _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [packages/contractkit/src/kit.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L97)*

factory for core contract's native web3 wrappers

___

###  contracts

• **contracts**: *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [packages/contractkit/src/kit.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L99)*

factory for core contract's kit wrappers

___

###  registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/contractkit/src/kit.ts:95](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L95)*

core contract's address registry

___

###  web3

• **web3**: *Web3*

*Defined in [packages/contractkit/src/kit.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L102)*

## Accessors

###  defaultAccount

• **get defaultAccount**(): *[Address](../modules/_base_.md#address) | undefined*

*Defined in [packages/contractkit/src/kit.ts:218](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L218)*

Default account for generated transactions (eg. tx.from)

**Returns:** *[Address](../modules/_base_.md#address) | undefined*

• **set defaultAccount**(`address`: [Address](../modules/_base_.md#address) | undefined): *void*

*Defined in [packages/contractkit/src/kit.ts:210](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L210)*

Set default account for generated transactions (eg. tx.from )

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

*Defined in [packages/contractkit/src/kit.ts:251](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L251)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: [Address](../modules/_base_.md#address) | undefined): *void*

*Defined in [packages/contractkit/src/kit.ts:247](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L247)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) &#124; undefined | ERC20 address  |

**Returns:** *void*

___

###  gasInflationFactor

• **get gasInflationFactor**(): *number*

*Defined in [packages/contractkit/src/kit.ts:227](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L227)*

**Returns:** *number*

• **set gasInflationFactor**(`factor`: number): *void*

*Defined in [packages/contractkit/src/kit.ts:223](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L223)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

___

###  gasPrice

• **get gasPrice**(): *number*

*Defined in [packages/contractkit/src/kit.ts:235](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L235)*

**Returns:** *number*

• **set gasPrice**(`price`: number): *void*

*Defined in [packages/contractkit/src/kit.ts:231](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L231)*

**Parameters:**

Name | Type |
------ | ------ |
`price` | number |

**Returns:** *void*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [packages/contractkit/src/kit.ts:202](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L202)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  fillGasPrice

▸ **fillGasPrice**(`tx`: Tx): *Promise‹Tx›*

*Defined in [packages/contractkit/src/kit.ts:276](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L276)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *Promise‹Tx›*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:395](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L395)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getEpochSize

▸ **getEpochSize**(): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:368](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L368)*

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:375](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L375)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:385](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L385)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getNetworkConfig

▸ **getNetworkConfig**(): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

*Defined in [packages/contractkit/src/kit.ts:142](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L142)*

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

___

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹AccountBalance›*

*Defined in [packages/contractkit/src/kit.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹AccountBalance›*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [packages/contractkit/src/kit.ts:255](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L255)*

**Returns:** *Promise‹boolean›*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [packages/contractkit/src/kit.ts:259](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L259)*

**Returns:** *Promise‹boolean›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: Tx): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [packages/contractkit/src/kit.ts:297](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L297)*

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

*Defined in [packages/contractkit/src/kit.ts:322](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L322)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | TransactionObject‹any› |
`tx?` | Omit‹Tx, "data"› |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  setFeeCurrency

▸ **setFeeCurrency**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹void›*

*Defined in [packages/contractkit/src/kit.ts:197](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L197)*

Set CeloToken to use to pay for gas fees

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | cUSD (StableToken) or CELO (GoldToken)  |

**Returns:** *Promise‹void›*

___

###  stop

▸ **stop**(): *void*

*Defined in [packages/contractkit/src/kit.ts:406](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L406)*

**Returns:** *void*
