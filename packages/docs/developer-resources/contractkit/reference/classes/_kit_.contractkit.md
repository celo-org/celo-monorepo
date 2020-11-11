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
* [getHumanReadableNetworkConfig](_kit_.contractkit.md#gethumanreadablenetworkconfig)
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

*Defined in [packages/contractkit/src/kit.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L105)*

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |
`wallet?` | [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md) |

**Returns:** *[ContractKit](_kit_.contractkit.md)*

## Properties

###  _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [packages/contractkit/src/kit.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L101)*

factory for core contract's native web3 wrappers

___

###  contracts

• **contracts**: *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [packages/contractkit/src/kit.ts:103](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L103)*

factory for core contract's kit wrappers

___

###  registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/contractkit/src/kit.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L99)*

core contract's address registry

___

###  web3

• **web3**: *Web3*

*Defined in [packages/contractkit/src/kit.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L106)*

## Accessors

###  defaultAccount

• **get defaultAccount**(): *[Address](../modules/_base_.md#address) | undefined*

*Defined in [packages/contractkit/src/kit.ts:275](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L275)*

Default account for generated transactions (eg. tx.from)

**Returns:** *[Address](../modules/_base_.md#address) | undefined*

• **set defaultAccount**(`address`: [Address](../modules/_base_.md#address) | undefined): *void*

*Defined in [packages/contractkit/src/kit.ts:267](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L267)*

Set default account for generated transactions (eg. tx.from )

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

*Defined in [packages/contractkit/src/kit.ts:308](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L308)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: [Address](../modules/_base_.md#address) | undefined): *void*

*Defined in [packages/contractkit/src/kit.ts:304](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L304)*

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

*Defined in [packages/contractkit/src/kit.ts:284](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L284)*

**Returns:** *number*

• **set gasInflationFactor**(`factor`: number): *void*

*Defined in [packages/contractkit/src/kit.ts:280](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L280)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

___

###  gasPrice

• **get gasPrice**(): *number*

*Defined in [packages/contractkit/src/kit.ts:292](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L292)*

**Returns:** *number*

• **set gasPrice**(`price`: number): *void*

*Defined in [packages/contractkit/src/kit.ts:288](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L288)*

**Parameters:**

Name | Type |
------ | ------ |
`price` | number |

**Returns:** *void*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [packages/contractkit/src/kit.ts:259](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L259)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  fillGasPrice

▸ **fillGasPrice**(`tx`: Tx): *Promise‹Tx›*

*Defined in [packages/contractkit/src/kit.ts:333](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L333)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *Promise‹Tx›*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:478](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L478)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getEpochSize

▸ **getEpochSize**(): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:451](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L451)*

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:458](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L458)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getHumanReadableNetworkConfig

▸ **getHumanReadableNetworkConfig**(): *Promise‹object›*

*Defined in [packages/contractkit/src/kit.ts:202](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L202)*

**Returns:** *Promise‹object›*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/contractkit/src/kit.ts:468](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L468)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getNetworkConfig

▸ **getNetworkConfig**(): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

*Defined in [packages/contractkit/src/kit.ts:151](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L151)*

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

___

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹AccountBalance›*

*Defined in [packages/contractkit/src/kit.ts:129](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L129)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹AccountBalance›*

___

###  getWallet

▸ **getWallet**(): *[ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)*

*Defined in [packages/contractkit/src/kit.ts:124](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L124)*

**Returns:** *[ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [packages/contractkit/src/kit.ts:312](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L312)*

**Returns:** *Promise‹boolean›*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [packages/contractkit/src/kit.ts:316](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L316)*

**Returns:** *Promise‹boolean›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: Tx): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [packages/contractkit/src/kit.ts:354](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L354)*

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

*Defined in [packages/contractkit/src/kit.ts:379](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L379)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | TransactionObject‹any› |
`tx?` | Omit‹Tx, "data"› |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  setFeeCurrency

▸ **setFeeCurrency**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹void›*

*Defined in [packages/contractkit/src/kit.ts:254](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L254)*

Set CeloToken to use to pay for gas fees

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | cUSD (StableToken) or CELO (GoldToken)  |

**Returns:** *Promise‹void›*

___

###  signTypedData

▸ **signTypedData**(`signer`: string, `typedData`: EIP712TypedData): *Promise‹Signature›*

*Defined in [packages/contractkit/src/kit.ts:414](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L414)*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | string |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹Signature›*

___

###  stop

▸ **stop**(): *void*

*Defined in [packages/contractkit/src/kit.ts:489](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L489)*

**Returns:** *void*
