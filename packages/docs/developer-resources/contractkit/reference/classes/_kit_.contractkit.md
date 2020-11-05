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
* [getWallet](_kit_.contractkit.md#getwallet)
* [isListening](_kit_.contractkit.md#islistening)
* [isSyncing](_kit_.contractkit.md#issyncing)
* [sendTransaction](_kit_.contractkit.md#sendtransaction)
* [sendTransactionObject](_kit_.contractkit.md#sendtransactionobject)
* [setFeeCurrency](_kit_.contractkit.md#setfeecurrency)
* [signTypedData](_kit_.contractkit.md#signtypeddata)
* [stop](_kit_.contractkit.md#stop)

## Constructors

###  constructor

\+ **new ContractKit**(`web3`: Web3, `wallet?`: [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)): *[ContractKit](_kit_.contractkit.md)*

*Defined in [packages/contractkit/src/kit.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L104)*

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |
`wallet?` | [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md) |

**Returns:** *[ContractKit](_kit_.contractkit.md)*

## Properties

###  _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [packages/contractkit/src/kit.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L100)*

factory for core contract's native web3 wrappers

___

###  contracts

• **contracts**: *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [packages/contractkit/src/kit.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L102)*

factory for core contract's kit wrappers

___

###  registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/contractkit/src/kit.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L98)*

core contract's address registry

___

###  web3

• **web3**: *Web3*

*Defined in [packages/contractkit/src/kit.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L105)*

## Accessors

###  defaultAccount

• **get defaultAccount**(): *[Address](../modules/_base_.md#address) | undefined*

*Defined in [packages/contractkit/src/kit.ts:226](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L226)*

Default account for generated transactions (eg. tx.from)

**Returns:** *[Address](../modules/_base_.md#address) | undefined*

• **set defaultAccount**(`address`: [Address](../modules/_base_.md#address) | undefined): *void*

*Defined in [packages/contractkit/src/kit.ts:218](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L218)*

Set default account for generated transactions (eg. tx.from )

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

*Defined in [packages/contractkit/src/kit.ts:259](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L259)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: [Address](../modules/_base_.md#address) | undefined): *void*

*Defined in [packages/contractkit/src/kit.ts:255](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L255)*

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

*Defined in [packages/contractkit/src/kit.ts:235](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L235)*

**Returns:** *number*

• **set gasInflationFactor**(`factor`: number): *void*

*Defined in [packages/contractkit/src/kit.ts:231](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L231)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

___

###  gasPrice

• **get gasPrice**(): *number*

*Defined in [packages/contractkit/src/kit.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L243)*

**Returns:** *number*

• **set gasPrice**(`price`: number): *void*

*Defined in [packages/contractkit/src/kit.ts:239](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L239)*

**Parameters:**

Name | Type |
------ | ------ |
`price` | number |

**Returns:** *void*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [packages/contractkit/src/kit.ts:210](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L210)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  fillGasPrice

▸ **fillGasPrice**(`tx`: Tx): *Promise‹Tx›*

*Defined in [packages/contractkit/src/kit.ts:284](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L284)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *Promise‹Tx›*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:427](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L427)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getEpochSize

▸ **getEpochSize**(): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:400](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L400)*

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:407](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L407)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:417](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L417)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getNetworkConfig

▸ **getNetworkConfig**(): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

*Defined in [packages/contractkit/src/kit.ts:150](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L150)*

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

___

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹AccountBalance›*

*Defined in [packages/contractkit/src/kit.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L128)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹AccountBalance›*

___

###  getWallet

▸ **getWallet**(): *[ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)*

*Defined in [packages/contractkit/src/kit.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L123)*

**Returns:** *[ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [packages/contractkit/src/kit.ts:263](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L263)*

**Returns:** *Promise‹boolean›*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [packages/contractkit/src/kit.ts:267](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L267)*

**Returns:** *Promise‹boolean›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: Tx): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [packages/contractkit/src/kit.ts:305](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L305)*

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

*Defined in [packages/contractkit/src/kit.ts:330](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L330)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | TransactionObject‹any› |
`tx?` | Omit‹Tx, "data"› |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  setFeeCurrency

▸ **setFeeCurrency**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹void›*

*Defined in [packages/contractkit/src/kit.ts:205](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L205)*

Set CeloToken to use to pay for gas fees

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | cUSD (StableToken) or CELO (GoldToken)  |

**Returns:** *Promise‹void›*

___

###  signTypedData

▸ **signTypedData**(`signer`: string, `typedData`: EIP712TypedData): *Promise‹Signature›*

*Defined in [packages/contractkit/src/kit.ts:363](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L363)*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | string |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹Signature›*

___

###  stop

▸ **stop**(): *void*

*Defined in [packages/contractkit/src/kit.ts:438](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L438)*

**Returns:** *void*
