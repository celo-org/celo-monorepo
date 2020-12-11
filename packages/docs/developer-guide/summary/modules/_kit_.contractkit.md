# ContractKit

## Hierarchy

* **ContractKit**

## Index

### Constructors

* [constructor]()

### Properties

* [\_web3Contracts]()
* [contracts]()
* [registry]()
* [web3]()

### Accessors

* [defaultAccount]()
* [defaultFeeCurrency]()
* [gasInflationFactor]()
* [gasPrice]()

### Methods

* [addAccount]()
* [fillGasPrice]()
* [getEpochNumberOfBlock]()
* [getEpochSize]()
* [getFirstBlockNumberForEpoch]()
* [getHumanReadableNetworkConfig]()
* [getLastBlockNumberForEpoch]()
* [getNetworkConfig]()
* [getTotalBalance]()
* [getWallet]()
* [isListening]()
* [isSyncing]()
* [sendTransaction]()
* [sendTransactionObject]()
* [setFeeCurrency]()
* [signTypedData]()
* [stop]()

## Constructors

### constructor

+ **new ContractKit**\(`web3`: Web3, `wallet?`: [ReadOnlyWallet]()\): [_ContractKit_]()

_Defined in_ [_packages/contractkit/src/kit.ts:105_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L105)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `web3` | Web3 |
| `wallet?` | [ReadOnlyWallet]() |

**Returns:** [_ContractKit_]()

## Properties

### `Readonly` \_web3Contracts

• **\_web3Contracts**: [_Web3ContractCache_]()

_Defined in_ [_packages/contractkit/src/kit.ts:101_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L101)

factory for core contract's native web3 wrappers

### `Readonly` contracts

• **contracts**: [_WrapperCache_]()

_Defined in_ [_packages/contractkit/src/kit.ts:103_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L103)

factory for core contract's kit wrappers

### `Readonly` registry

• **registry**: [_AddressRegistry_]()

_Defined in_ [_packages/contractkit/src/kit.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L99)

core contract's address registry

### `Readonly` web3

• **web3**: _Web3_

_Defined in_ [_packages/contractkit/src/kit.ts:106_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L106)

## Accessors

### defaultAccount

• **get defaultAccount**\(\): [_Address_](_base_.md#address) _\| undefined_

_Defined in_ [_packages/contractkit/src/kit.ts:275_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L275)

Default account for generated transactions \(eg. tx.from\)

**Returns:** [_Address_](_base_.md#address) _\| undefined_

• **set defaultAccount**\(`address`: [Address](_base_.md#address) \| undefined\): _void_

_Defined in_ [_packages/contractkit/src/kit.ts:267_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L267)

Set default account for generated transactions \(eg. tx.from \)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_base_.md#address) \| undefined |

**Returns:** _void_

### defaultFeeCurrency

• **get defaultFeeCurrency**\(\): _undefined \| string_

_Defined in_ [_packages/contractkit/src/kit.ts:308_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L308)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** _undefined \| string_

• **set defaultFeeCurrency**\(`address`: [Address](_base_.md#address) \| undefined\): _void_

_Defined in_ [_packages/contractkit/src/kit.ts:304_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L304)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](_base_.md#address) \| undefined | ERC20 address |

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

▸ **getNetworkConfig**\(\): _Promise‹_[_NetworkConfig_]()_›_

_Defined in_ [_packages/contractkit/src/kit.ts:151_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L151)

**Returns:** _Promise‹_[_NetworkConfig_]()_›_

### getTotalBalance

▸ **getTotalBalance**\(`address`: string\): _Promise‹AccountBalance›_

_Defined in_ [_packages/contractkit/src/kit.ts:129_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L129)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹AccountBalance›_

### getWallet

▸ **getWallet**\(\): [_ReadOnlyWallet_]()

_Defined in_ [_packages/contractkit/src/kit.ts:124_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L124)

**Returns:** [_ReadOnlyWallet_]()

### isListening

▸ **isListening**\(\): _Promise‹boolean›_

_Defined in_ [_packages/contractkit/src/kit.ts:312_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L312)

**Returns:** _Promise‹boolean›_

### isSyncing

▸ **isSyncing**\(\): _Promise‹boolean›_

_Defined in_ [_packages/contractkit/src/kit.ts:316_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L316)

**Returns:** _Promise‹boolean›_

### sendTransaction

▸ **sendTransaction**\(`tx`: Tx\): _Promise‹_[_TransactionResult_]()_›_

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

**Returns:** _Promise‹_[_TransactionResult_]()_›_

### sendTransactionObject

▸ **sendTransactionObject**\(`txObj`: TransactionObject‹any›, `tx?`: Omit‹Tx, "data"›\): _Promise‹_[_TransactionResult_]()_›_

_Defined in_ [_packages/contractkit/src/kit.ts:379_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L379)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txObj` | TransactionObject‹any› |
| `tx?` | Omit‹Tx, "data"› |

**Returns:** _Promise‹_[_TransactionResult_]()_›_

### setFeeCurrency

▸ **setFeeCurrency**\(`token`: [CeloToken](_base_.md#celotoken)\): _Promise‹void›_

_Defined in_ [_packages/contractkit/src/kit.ts:254_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L254)

Set CeloToken to use to pay for gas fees

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](_base_.md#celotoken) | cUSD \(StableToken\) or CELO \(GoldToken\) |

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

