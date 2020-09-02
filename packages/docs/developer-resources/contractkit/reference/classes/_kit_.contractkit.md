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

*Defined in [packages/contractkit/src/kit.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L99)*

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |
`wallet?` | [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md) |

**Returns:** *[ContractKit](_kit_.contractkit.md)*

## Properties

###  _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [packages/contractkit/src/kit.ts:95](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L95)*

factory for core contract's native web3 wrappers

___

###  contracts

• **contracts**: *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [packages/contractkit/src/kit.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L97)*

factory for core contract's kit wrappers

___

###  registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/contractkit/src/kit.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L93)*

core contract's address registry

___

###  web3

• **web3**: *Web3*

*Defined in [packages/contractkit/src/kit.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L100)*

## Accessors

###  defaultAccount

• **get defaultAccount**(): *[Address](../modules/_base_.md#address) | undefined*

*Defined in [packages/contractkit/src/kit.ts:213](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L213)*

Default account for generated transactions (eg. tx.from)

**Returns:** *[Address](../modules/_base_.md#address) | undefined*

• **set defaultAccount**(`address`: [Address](../modules/_base_.md#address) | undefined): *void*

*Defined in [packages/contractkit/src/kit.ts:205](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L205)*

Set default account for generated transactions (eg. tx.from )

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

*Defined in [packages/contractkit/src/kit.ts:246](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L246)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: [Address](../modules/_base_.md#address) | undefined): *void*

*Defined in [packages/contractkit/src/kit.ts:242](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L242)*

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

*Defined in [packages/contractkit/src/kit.ts:222](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L222)*

**Returns:** *number*

• **set gasInflationFactor**(`factor`: number): *void*

*Defined in [packages/contractkit/src/kit.ts:218](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L218)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

___

###  gasPrice

• **get gasPrice**(): *number*

*Defined in [packages/contractkit/src/kit.ts:230](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L230)*

**Returns:** *number*

• **set gasPrice**(`price`: number): *void*

*Defined in [packages/contractkit/src/kit.ts:226](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L226)*

**Parameters:**

Name | Type |
------ | ------ |
`price` | number |

**Returns:** *void*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [packages/contractkit/src/kit.ts:197](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L197)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  fillGasPrice

▸ **fillGasPrice**(`tx`: Tx): *Promise‹Tx›*

*Defined in [packages/contractkit/src/kit.ts:271](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L271)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *Promise‹Tx›*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:390](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L390)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getEpochSize

▸ **getEpochSize**(): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:363](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L363)*

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:370](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L370)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:380](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L380)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getNetworkConfig

▸ **getNetworkConfig**(): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

*Defined in [packages/contractkit/src/kit.ts:140](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L140)*

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

___

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹AccountBalance›*

*Defined in [packages/contractkit/src/kit.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L118)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹AccountBalance›*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [packages/contractkit/src/kit.ts:250](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L250)*

**Returns:** *Promise‹boolean›*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [packages/contractkit/src/kit.ts:254](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L254)*

**Returns:** *Promise‹boolean›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: Tx): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [packages/contractkit/src/kit.ts:292](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L292)*

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

*Defined in [packages/contractkit/src/kit.ts:317](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L317)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | TransactionObject‹any› |
`tx?` | Omit‹Tx, "data"› |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  setFeeCurrency

▸ **setFeeCurrency**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹void›*

*Defined in [packages/contractkit/src/kit.ts:192](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L192)*

Set CeloToken to use to pay for gas fees

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | cUSD (StableToken) or CELO (GoldToken)  |

**Returns:** *Promise‹void›*

___

###  stop

▸ **stop**(): *void*

*Defined in [packages/contractkit/src/kit.ts:401](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L401)*

**Returns:** *void*
