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

\+ **new ContractKit**(`web3`: Web3, `wallet?`: [Wallet](../interfaces/_wallets_wallet_.wallet.md)): *[ContractKit](_kit_.contractkit.md)*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L93)*
=======
*Defined in [contractkit/src/kit.ts:96](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L96)*
>>>>>>> master

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |
`wallet?` | [Wallet](../interfaces/_wallets_wallet_.wallet.md) |

**Returns:** *[ContractKit](_kit_.contractkit.md)*

## Properties

###  _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L89)*
=======
*Defined in [contractkit/src/kit.ts:92](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L92)*
>>>>>>> master

factory for core contract's native web3 wrappers

___

###  contracts

• **contracts**: *[WrapperCache](_contract_cache_.wrappercache.md)*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:91](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L91)*
=======
*Defined in [contractkit/src/kit.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L94)*
>>>>>>> master

factory for core contract's kit wrappers

___

###  registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L87)*
=======
*Defined in [contractkit/src/kit.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L90)*
>>>>>>> master

core contract's address registry

___

###  web3

• **web3**: *Web3*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L94)*
=======
*Defined in [contractkit/src/kit.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L97)*
>>>>>>> master

## Accessors

###  defaultAccount

• **get defaultAccount**(): *[Address](../modules/_base_.md#address) | undefined*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:210](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L210)*
=======
*Defined in [contractkit/src/kit.ts:206](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L206)*
>>>>>>> master

Default account for generated transactions (eg. tx.from)

**Returns:** *[Address](../modules/_base_.md#address) | undefined*

• **set defaultAccount**(`address`: [Address](../modules/_base_.md#address) | undefined): *void*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:202](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L202)*
=======
*Defined in [contractkit/src/kit.ts:198](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L198)*
>>>>>>> master

Set default account for generated transactions (eg. tx.from )

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L243)*
=======
*Defined in [contractkit/src/kit.ts:239](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L239)*
>>>>>>> master

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use cGLD

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: [Address](../modules/_base_.md#address) | undefined): *void*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:239](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L239)*
=======
*Defined in [contractkit/src/kit.ts:235](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L235)*
>>>>>>> master

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

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:219](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L219)*
=======
*Defined in [contractkit/src/kit.ts:215](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L215)*
>>>>>>> master

**Returns:** *number*

• **set gasInflationFactor**(`factor`: number): *void*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:215](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L215)*
=======
*Defined in [contractkit/src/kit.ts:211](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L211)*
>>>>>>> master

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

___

###  gasPrice

• **get gasPrice**(): *number*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:227](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L227)*
=======
*Defined in [contractkit/src/kit.ts:223](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L223)*
>>>>>>> master

**Returns:** *number*

• **set gasPrice**(`price`: number): *void*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:223](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L223)*
=======
*Defined in [contractkit/src/kit.ts:219](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L219)*
>>>>>>> master

**Parameters:**

Name | Type |
------ | ------ |
`price` | number |

**Returns:** *void*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:194](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L194)*
=======
*Defined in [contractkit/src/kit.ts:190](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L190)*
>>>>>>> master

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:353](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L353)*
=======
*Defined in [contractkit/src/kit.ts:366](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L366)*
>>>>>>> master

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:331](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L331)*
=======
*Defined in [contractkit/src/kit.ts:344](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L344)*
>>>>>>> master

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:342](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L342)*
=======
*Defined in [contractkit/src/kit.ts:355](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L355)*
>>>>>>> master

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getNetworkConfig

▸ **getNetworkConfig**(): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:137](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L137)*
=======
*Defined in [contractkit/src/kit.ts:140](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L140)*
>>>>>>> master

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

___

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹AccountBalance›*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L111)*
=======
*Defined in [contractkit/src/kit.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L114)*
>>>>>>> master

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹AccountBalance›*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:247](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L247)*
=======
*Defined in [contractkit/src/kit.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L243)*
>>>>>>> master

**Returns:** *Promise‹boolean›*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:251](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L251)*
=======
*Defined in [contractkit/src/kit.ts:247](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L247)*
>>>>>>> master

**Returns:** *Promise‹boolean›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: Tx): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:275](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L275)*
=======
*Defined in [contractkit/src/kit.ts:271](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L271)*
>>>>>>> master

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

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:294](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L294)*
=======
*Defined in [contractkit/src/kit.ts:295](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L295)*
>>>>>>> master

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | TransactionObject‹any› |
`tx?` | Omit‹Tx, "data"› |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  setFeeCurrency

▸ **setFeeCurrency**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹void›*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:189](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L189)*
=======
*Defined in [contractkit/src/kit.ts:185](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L185)*
>>>>>>> master

Set CeloToken to use to pay for gas fees

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | cUSD (StableToken) or cGLD (GoldToken)  |

**Returns:** *Promise‹void›*

___

###  stop

▸ **stop**(): *void*

<<<<<<< HEAD
*Defined in [contractkit/src/kit.ts:365](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L365)*
=======
*Defined in [contractkit/src/kit.ts:378](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L378)*
>>>>>>> master

**Returns:** *void*
