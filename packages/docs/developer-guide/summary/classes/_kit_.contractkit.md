# ContractKit

## Hierarchy

* **ContractKit**

## Index

### Constructors

* [constructor](_kit_.contractkit.md#constructor)

### Properties

* [\_web3Contracts](_kit_.contractkit.md#readonly-_web3contracts)
* [contracts](_kit_.contractkit.md#readonly-contracts)
* [registry](_kit_.contractkit.md#readonly-registry)
* [web3](_kit_.contractkit.md#readonly-web3)

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

### constructor

+ **new ContractKit**\(`web3`: Web3, `wallet?`: [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)\): [_ContractKit_](_kit_.contractkit.md)

_Defined in_ [_packages/contractkit/src/kit.ts:105_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L105)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `web3` | Web3 |
| `wallet?` | [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md) |

**Returns:** [_ContractKit_](_kit_.contractkit.md)

## Properties

### `Readonly` \_web3Contracts

• **\_web3Contracts**: [_Web3ContractCache_](_web3_contract_cache_.web3contractcache.md)

_Defined in_ [_packages/contractkit/src/kit.ts:101_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L101)

factory for core contract's native web3 wrappers

### `Readonly` contracts

• **contracts**: [_WrapperCache_](_contract_cache_.wrappercache.md)

_Defined in_ [_packages/contractkit/src/kit.ts:103_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L103)

factory for core contract's kit wrappers

### `Readonly` registry

• **registry**: [_AddressRegistry_](_address_registry_.addressregistry.md)

_Defined in_ [_packages/contractkit/src/kit.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L99)

core contract's address registry

### `Readonly` web3

• **web3**: _Web3_

_Defined in_ [_packages/contractkit/src/kit.ts:106_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L106)

## Accessors

### defaultAccount

• **get defaultAccount**\(\): [_Address_](../modules/_base_.md#address) _\| undefined_

_Defined in_ [_packages/contractkit/src/kit.ts:275_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L275)

Default account for generated transactions \(eg. tx.from\)

**Returns:** [_Address_](../modules/_base_.md#address) _\| undefined_

• **set defaultAccount**\(`address`: [Address](../modules/_base_.md#address) \| undefined\): _void_

_Defined in_ [_packages/contractkit/src/kit.ts:267_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L267)

Set default account for generated transactions \(eg. tx.from \)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) \| undefined |

**Returns:** _void_

### defaultFeeCurrency

• **get defaultFeeCurrency**\(\): _undefined \| string_

_Defined in_ [_packages/contractkit/src/kit.ts:308_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L308)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** _undefined \| string_

• **set defaultFeeCurrency**\(`address`: [Address](../modules/_base_.md#address) \| undefined\): _void_

_Defined in_ [_packages/contractkit/src/kit.ts:304_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L304)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) \| undefined | ERC20 address |

**Returns:** _void_

### gasInflationFactor

• **get gasInflationFactor**\(\): _number_

_Defined in_ [_packages/contractkit/src/kit.ts:284_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L284)

**Returns:** _number_

• **set gasInflationFactor**\(`factor`: number\): _void_

_Defined in_ [_packages/contractkit/src/kit.ts:280_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L280)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `factor` | number |

**Returns:** _void_

### gasPrice

• **get gasPrice**\(\): _number_

_Defined in_ [_packages/contractkit/src/kit.ts:292_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L292)

**Returns:** _number_

• **set gasPrice**\(`price`: number\): _void_

_Defined in_ [_packages/contractkit/src/kit.ts:288_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L288)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `price` | number |

**Returns:** _void_

## Methods

### addAccount

▸ **addAccount**\(`privateKey`: string\): _void_

_Defined in_ [_packages/contractkit/src/kit.ts:259_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L259)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |

**Returns:** _void_

### fillGasPrice

▸ **fillGasPrice**\(`tx`: Tx\): _Promise‹Tx›_

_Defined in_ [_packages/contractkit/src/kit.ts:333_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L333)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | Tx |

**Returns:** _Promise‹Tx›_

### getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**\(`blockNumber`: number\): _Promise‹number›_

_Defined in_ [_packages/contractkit/src/kit.ts:478_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L478)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockNumber` | number |

**Returns:** _Promise‹number›_

### getEpochSize

▸ **getEpochSize**\(\): _Promise‹number›_

_Defined in_ [_packages/contractkit/src/kit.ts:451_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L451)

**Returns:** _Promise‹number›_

### getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**\(`epochNumber`: number\): _Promise‹number›_

_Defined in_ [_packages/contractkit/src/kit.ts:458_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L458)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `epochNumber` | number |

**Returns:** _Promise‹number›_

### getHumanReadableNetworkConfig

▸ **getHumanReadableNetworkConfig**\(\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/kit.ts:202_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L202)

**Returns:** _Promise‹object›_

### getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**\(`epochNumber`: number\): _Promise‹number›_

_Defined in_ [_packages/contractkit/src/kit.ts:468_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L468)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `epochNumber` | number |

**Returns:** _Promise‹number›_

### getNetworkConfig

▸ **getNetworkConfig**\(\): _Promise‹_[_NetworkConfig_](../interfaces/_kit_.networkconfig.md)_›_

_Defined in_ [_packages/contractkit/src/kit.ts:151_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L151)

**Returns:** _Promise‹_[_NetworkConfig_](../interfaces/_kit_.networkconfig.md)_›_

### getTotalBalance

▸ **getTotalBalance**\(`address`: string\): _Promise‹AccountBalance›_

_Defined in_ [_packages/contractkit/src/kit.ts:129_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L129)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹AccountBalance›_

### getWallet

▸ **getWallet**\(\): [_ReadOnlyWallet_](../interfaces/_wallets_wallet_.readonlywallet.md)

_Defined in_ [_packages/contractkit/src/kit.ts:124_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L124)

**Returns:** [_ReadOnlyWallet_](../interfaces/_wallets_wallet_.readonlywallet.md)

### isListening

▸ **isListening**\(\): _Promise‹boolean›_

_Defined in_ [_packages/contractkit/src/kit.ts:312_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L312)

**Returns:** _Promise‹boolean›_

### isSyncing

▸ **isSyncing**\(\): _Promise‹boolean›_

_Defined in_ [_packages/contractkit/src/kit.ts:316_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L316)

**Returns:** _Promise‹boolean›_

### sendTransaction

▸ **sendTransaction**\(`tx`: Tx\): _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

_Defined in_ [_packages/contractkit/src/kit.ts:354_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L354)

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

_Defined in_ [_packages/contractkit/src/kit.ts:379_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L379)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txObj` | TransactionObject‹any› |
| `tx?` | Omit‹Tx, "data"› |

**Returns:** _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

### setFeeCurrency

▸ **setFeeCurrency**\(`token`: [CeloToken](../modules/_base_.md#celotoken)\): _Promise‹void›_

_Defined in_ [_packages/contractkit/src/kit.ts:254_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L254)

Set CeloToken to use to pay for gas fees

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../modules/_base_.md#celotoken) | cUSD \(StableToken\) or CELO \(GoldToken\) |

**Returns:** _Promise‹void›_

### signTypedData

▸ **signTypedData**\(`signer`: string, `typedData`: EIP712TypedData\): _Promise‹Signature›_

_Defined in_ [_packages/contractkit/src/kit.ts:414_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L414)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signer` | string |
| `typedData` | EIP712TypedData |

**Returns:** _Promise‹Signature›_

### stop

▸ **stop**\(\): _void_

_Defined in_ [_packages/contractkit/src/kit.ts:489_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L489)

**Returns:** _void_

