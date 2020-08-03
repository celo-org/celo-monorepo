# Class: ContractKit

## Hierarchy

* **ContractKit**

## Index

### Constructors

* [constructor](_contractkit_src_kit_.contractkit.md#constructor)

### Properties

* [_web3Contracts](_contractkit_src_kit_.contractkit.md#_web3contracts)
* [contracts](_contractkit_src_kit_.contractkit.md#contracts)
* [registry](_contractkit_src_kit_.contractkit.md#registry)
* [web3](_contractkit_src_kit_.contractkit.md#web3)

### Accessors

* [defaultAccount](_contractkit_src_kit_.contractkit.md#defaultaccount)
* [defaultFeeCurrency](_contractkit_src_kit_.contractkit.md#defaultfeecurrency)
* [gasInflationFactor](_contractkit_src_kit_.contractkit.md#gasinflationfactor)
* [gasPrice](_contractkit_src_kit_.contractkit.md#gasprice)

### Methods

* [addAccount](_contractkit_src_kit_.contractkit.md#addaccount)
* [getEpochNumberOfBlock](_contractkit_src_kit_.contractkit.md#getepochnumberofblock)
* [getEpochSize](_contractkit_src_kit_.contractkit.md#getepochsize)
* [getFirstBlockNumberForEpoch](_contractkit_src_kit_.contractkit.md#getfirstblocknumberforepoch)
* [getLastBlockNumberForEpoch](_contractkit_src_kit_.contractkit.md#getlastblocknumberforepoch)
* [getNetworkConfig](_contractkit_src_kit_.contractkit.md#getnetworkconfig)
* [getTotalBalance](_contractkit_src_kit_.contractkit.md#gettotalbalance)
* [isListening](_contractkit_src_kit_.contractkit.md#islistening)
* [isSyncing](_contractkit_src_kit_.contractkit.md#issyncing)
* [sendTransaction](_contractkit_src_kit_.contractkit.md#sendtransaction)
* [sendTransactionObject](_contractkit_src_kit_.contractkit.md#sendtransactionobject)
* [setFeeCurrency](_contractkit_src_kit_.contractkit.md#setfeecurrency)
* [stop](_contractkit_src_kit_.contractkit.md#stop)

## Constructors

###  constructor

\+ **new ContractKit**(`web3`: Web3, `wallet?`: [Wallet](../interfaces/_contractkit_src_wallets_wallet_.wallet.md)): *[ContractKit](_contractkit_src_kit_.contractkit.md)*

*Defined in [contractkit/src/kit.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L97)*

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |
`wallet?` | [Wallet](../interfaces/_contractkit_src_wallets_wallet_.wallet.md) |

**Returns:** *[ContractKit](_contractkit_src_kit_.contractkit.md)*

## Properties

###  _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_contractkit_src_web3_contract_cache_.web3contractcache.md)*

*Defined in [contractkit/src/kit.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L93)*

factory for core contract's native web3 wrappers

___

###  contracts

• **contracts**: *[WrapperCache](_contractkit_src_contract_cache_.wrappercache.md)*

*Defined in [contractkit/src/kit.ts:95](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L95)*

factory for core contract's kit wrappers

___

###  registry

• **registry**: *[AddressRegistry](_contractkit_src_address_registry_.addressregistry.md)*

*Defined in [contractkit/src/kit.ts:91](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L91)*

core contract's address registry

___

###  web3

• **web3**: *Web3*

*Defined in [contractkit/src/kit.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L98)*

## Accessors

###  defaultAccount

• **get defaultAccount**(): *[Address](../modules/_contractkit_src_base_.md#address) | undefined*

*Defined in [contractkit/src/kit.ts:210](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L210)*

Default account for generated transactions (eg. tx.from)

**Returns:** *[Address](../modules/_contractkit_src_base_.md#address) | undefined*

• **set defaultAccount**(`address`: [Address](../modules/_contractkit_src_base_.md#address) | undefined): *void*

*Defined in [contractkit/src/kit.ts:202](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L202)*

Set default account for generated transactions (eg. tx.from )

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

*Defined in [contractkit/src/kit.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L243)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: [Address](../modules/_contractkit_src_base_.md#address) | undefined): *void*

*Defined in [contractkit/src/kit.ts:239](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L239)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) &#124; undefined | ERC20 address  |

**Returns:** *void*

___

###  gasInflationFactor

• **get gasInflationFactor**(): *number*

*Defined in [contractkit/src/kit.ts:219](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L219)*

**Returns:** *number*

• **set gasInflationFactor**(`factor`: number): *void*

*Defined in [contractkit/src/kit.ts:215](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L215)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

___

###  gasPrice

• **get gasPrice**(): *number*

*Defined in [contractkit/src/kit.ts:227](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L227)*

**Returns:** *number*

• **set gasPrice**(`price`: number): *void*

*Defined in [contractkit/src/kit.ts:223](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L223)*

**Parameters:**

Name | Type |
------ | ------ |
`price` | number |

**Returns:** *void*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [contractkit/src/kit.ts:194](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L194)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:375](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L375)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getEpochSize

▸ **getEpochSize**(): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:348](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L348)*

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:355](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L355)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:365](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L365)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getNetworkConfig

▸ **getNetworkConfig**(): *Promise‹[NetworkConfig](../interfaces/_contractkit_src_kit_.networkconfig.md)›*

*Defined in [contractkit/src/kit.ts:137](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L137)*

**Returns:** *Promise‹[NetworkConfig](../interfaces/_contractkit_src_kit_.networkconfig.md)›*

___

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹AccountBalance›*

*Defined in [contractkit/src/kit.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L115)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹AccountBalance›*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [contractkit/src/kit.ts:247](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L247)*

**Returns:** *Promise‹boolean›*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [contractkit/src/kit.ts:251](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L251)*

**Returns:** *Promise‹boolean›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: Tx): *Promise‹[TransactionResult](_contractkit_src_utils_tx_result_.transactionresult.md)›*

*Defined in [contractkit/src/kit.ts:275](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L275)*

Send a transaction to celo-blockchain.

Similar to `web3.eth.sendTransaction()` but with following differences:
 - applies kit tx's defaults
 - estimatesGas before sending
 - returns a `TransactionResult` instead of `PromiEvent`

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *Promise‹[TransactionResult](_contractkit_src_utils_tx_result_.transactionresult.md)›*

___

###  sendTransactionObject

▸ **sendTransactionObject**(`txObj`: TransactionObject‹any›, `tx?`: Omit‹Tx, "data"›): *Promise‹[TransactionResult](_contractkit_src_utils_tx_result_.transactionresult.md)›*

*Defined in [contractkit/src/kit.ts:299](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L299)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | TransactionObject‹any› |
`tx?` | Omit‹Tx, "data"› |

**Returns:** *Promise‹[TransactionResult](_contractkit_src_utils_tx_result_.transactionresult.md)›*

___

###  setFeeCurrency

▸ **setFeeCurrency**(`token`: [CeloToken](../modules/_contractkit_src_base_.md#celotoken)): *Promise‹void›*

*Defined in [contractkit/src/kit.ts:189](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L189)*

Set CeloToken to use to pay for gas fees

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_contractkit_src_base_.md#celotoken) | cUSD (StableToken) or CELO (GoldToken)  |

**Returns:** *Promise‹void›*

___

###  stop

▸ **stop**(): *void*

*Defined in [contractkit/src/kit.ts:386](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L386)*

**Returns:** *void*
