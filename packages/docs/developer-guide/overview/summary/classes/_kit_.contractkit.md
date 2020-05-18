# ContractKit

## Hierarchy

* **ContractKit**

## Index

### Constructors

* [constructor](_kit_.contractkit.md#constructor)

### Properties

* [\_web3Contracts](_kit_.contractkit.md#_web3contracts)
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

### constructor

+ **new ContractKit**\(`web3`: Web3, `wallet?`: [Wallet](../interfaces/_wallets_wallet_.wallet.md)\): [_ContractKit_](_kit_.contractkit.md)

_Defined in_ [_contractkit/src/kit.ts:98_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L98)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `web3` | Web3 |
| `wallet?` | [Wallet](../interfaces/_wallets_wallet_.wallet.md) |

**Returns:** [_ContractKit_](_kit_.contractkit.md)

## Properties

### \_web3Contracts

• **\_web3Contracts**: [_Web3ContractCache_](_web3_contract_cache_.web3contractcache.md)

_Defined in_ [_contractkit/src/kit.ts:94_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L94)

factory for core contract's native web3 wrappers

### contracts

• **contracts**: [_WrapperCache_](_contract_cache_.wrappercache.md)

_Defined in_ [_contractkit/src/kit.ts:96_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L96)

factory for core contract's kit wrappers

### registry

• **registry**: [_AddressRegistry_](_address_registry_.addressregistry.md)

_Defined in_ [_contractkit/src/kit.ts:92_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L92)

core contract's address registry

### web3

• **web3**: _Web3_

_Defined in_ [_contractkit/src/kit.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L99)

## Accessors

### defaultAccount

• **get defaultAccount**\(\): [_Address_](../external-modules/_base_.md#address) _\| undefined_

_Defined in_ [_contractkit/src/kit.ts:216_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L216)

Default account for generated transactions \(eg. tx.from\)

**Returns:** [_Address_](../external-modules/_base_.md#address) _\| undefined_

• **set defaultAccount**\(`address`: [Address](../external-modules/_base_.md#address) \| undefined\): _void_

_Defined in_ [_contractkit/src/kit.ts:208_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L208)

Set default account for generated transactions \(eg. tx.from \)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../external-modules/_base_.md#address) \| undefined |

**Returns:** _void_

### defaultFeeCurrency

• **get defaultFeeCurrency**\(\): _undefined \| string_

_Defined in_ [_contractkit/src/kit.ts:249_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L249)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use cGLD

**Returns:** _undefined \| string_

• **set defaultFeeCurrency**\(`address`: [Address](../external-modules/_base_.md#address) \| undefined\): _void_

_Defined in_ [_contractkit/src/kit.ts:245_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L245)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use cGLD

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../external-modules/_base_.md#address) \| undefined | ERC20 address |

**Returns:** _void_

### gasInflationFactor

• **get gasInflationFactor**\(\): _number_

_Defined in_ [_contractkit/src/kit.ts:225_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L225)

**Returns:** _number_

• **set gasInflationFactor**\(`factor`: number\): _void_

_Defined in_ [_contractkit/src/kit.ts:221_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L221)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `factor` | number |

**Returns:** _void_

### gasPrice

• **get gasPrice**\(\): _number_

_Defined in_ [_contractkit/src/kit.ts:233_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L233)

**Returns:** _number_

• **set gasPrice**\(`price`: number\): _void_

_Defined in_ [_contractkit/src/kit.ts:229_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L229)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `price` | number |

**Returns:** _void_

## Methods

### addAccount

▸ **addAccount**\(`privateKey`: string\): _void_

_Defined in_ [_contractkit/src/kit.ts:200_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L200)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |

**Returns:** _void_

### getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**\(`blockNumber`: number\): _Promise‹number›_

_Defined in_ [_contractkit/src/kit.ts:376_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L376)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockNumber` | number |

**Returns:** _Promise‹number›_

### getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**\(`epochNumber`: number\): _Promise‹number›_

_Defined in_ [_contractkit/src/kit.ts:354_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L354)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `epochNumber` | number |

**Returns:** _Promise‹number›_

### getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**\(`epochNumber`: number\): _Promise‹number›_

_Defined in_ [_contractkit/src/kit.ts:365_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L365)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `epochNumber` | number |

**Returns:** _Promise‹number›_

### getNetworkConfig

▸ **getNetworkConfig**\(\): _Promise‹_[_NetworkConfig_](../interfaces/_kit_.networkconfig.md)_›_

_Defined in_ [_contractkit/src/kit.ts:143_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L143)

**Returns:** _Promise‹_[_NetworkConfig_](../interfaces/_kit_.networkconfig.md)_›_

### getTotalBalance

▸ **getTotalBalance**\(`address`: string\): _Promise‹AccountBalance›_

_Defined in_ [_contractkit/src/kit.ts:116_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L116)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹AccountBalance›_

### isListening

▸ **isListening**\(\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/kit.ts:253_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L253)

**Returns:** _Promise‹boolean›_

### isSyncing

▸ **isSyncing**\(\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/kit.ts:257_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L257)

**Returns:** _Promise‹boolean›_

### sendTransaction

▸ **sendTransaction**\(`tx`: Tx\): _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

_Defined in_ [_contractkit/src/kit.ts:281_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L281)

Send a transaction to celo-blockchain.

Similar to `web3.eth.sendTransaction()` but with following differences:

* applies kit tx's defaults
* estimatesGas before sending
* returns a `TransactionResult` instead of `PromiEvent`

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | Tx |

**Returns:** _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

### sendTransactionObject

▸ **sendTransactionObject**\(`txObj`: TransactionObject‹any›, `tx?`: Omit‹Tx, "data"›\): _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

_Defined in_ [_contractkit/src/kit.ts:305_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L305)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txObj` | TransactionObject‹any› |
| `tx?` | Omit‹Tx, "data"› |

**Returns:** _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

### setFeeCurrency

▸ **setFeeCurrency**\(`token`: [CeloToken](../external-modules/_base_.md#celotoken)\): _Promise‹void›_

_Defined in_ [_contractkit/src/kit.ts:195_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L195)

Set CeloToken to use to pay for gas fees

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../external-modules/_base_.md#celotoken) | cUSD \(StableToken\) or cGLD \(GoldToken\) |

**Returns:** _Promise‹void›_

### stop

▸ **stop**\(\): _void_

_Defined in_ [_contractkit/src/kit.ts:388_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L388)

**Returns:** _void_

