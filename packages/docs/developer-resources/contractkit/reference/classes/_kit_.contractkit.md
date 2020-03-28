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

*Defined in [contractkit/src/kit.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |

**Returns:** *[ContractKit](_kit_.contractkit.md)*

## Properties

###  _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [contractkit/src/kit.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L84)*

factory for core contract's native web3 wrappers

___

###  contracts

• **contracts**: *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [contractkit/src/kit.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L86)*

factory for core contract's kit wrappers

___

###  registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [contractkit/src/kit.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L82)*

core contract's address registry

___

###  web3

• **web3**: *Web3*

*Defined in [contractkit/src/kit.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L89)*

## Accessors

###  defaultAccount

• **get defaultAccount**(): *[Address](../modules/_base_.md#address) | undefined*

*Defined in [contractkit/src/kit.ts:198](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L198)*

Default account for generated transactions (eg. tx.from)

**Returns:** *[Address](../modules/_base_.md#address) | undefined*

• **set defaultAccount**(`address`: [Address](../modules/_base_.md#address) | undefined): *void*

*Defined in [contractkit/src/kit.ts:190](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L190)*

Set default account for generated transactions (eg. tx.from )

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

*Defined in [contractkit/src/kit.ts:231](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L231)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use cGLD

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: [Address](../modules/_base_.md#address) | undefined): *void*

*Defined in [contractkit/src/kit.ts:227](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L227)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use cGLD

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) &#124; undefined | ERC20 address  |

**Returns:** *void*

___

###  gasInflationFactor

• **get gasInflationFactor**(): *number*

*Defined in [contractkit/src/kit.ts:207](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L207)*

**Returns:** *number*

• **set gasInflationFactor**(`factor`: number): *void*

*Defined in [contractkit/src/kit.ts:203](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L203)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

___

###  gasPrice

• **get gasPrice**(): *number*

*Defined in [contractkit/src/kit.ts:215](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L215)*

**Returns:** *number*

• **set gasPrice**(`price`: number): *void*

*Defined in [contractkit/src/kit.ts:211](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L211)*

**Parameters:**

Name | Type |
------ | ------ |
`price` | number |

**Returns:** *void*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [contractkit/src/kit.ts:182](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L182)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:341](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L341)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:319](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L319)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:330](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L330)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getNetworkConfig

▸ **getNetworkConfig**(): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

*Defined in [contractkit/src/kit.ts:132](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L132)*

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

___

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹AccountBalance›*

*Defined in [contractkit/src/kit.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L106)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹AccountBalance›*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [contractkit/src/kit.ts:235](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L235)*

**Returns:** *Promise‹boolean›*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [contractkit/src/kit.ts:239](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L239)*

**Returns:** *Promise‹boolean›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: Tx): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [contractkit/src/kit.ts:263](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L263)*

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

*Defined in [contractkit/src/kit.ts:282](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L282)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | TransactionObject‹any› |
`tx?` | Omit‹Tx, "data"› |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  setFeeCurrency

▸ **setFeeCurrency**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹void›*

*Defined in [contractkit/src/kit.ts:177](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L177)*

Set CeloToken to use to pay for gas fees

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | cUSD (StableToken) or cGLD (GoldToken)  |

**Returns:** *Promise‹void›*

___

###  stop

▸ **stop**(): *void*

*Defined in [contractkit/src/kit.ts:353](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L353)*

**Returns:** *void*
