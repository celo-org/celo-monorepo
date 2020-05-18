# Web3ContractCache

Native Web3 contracts factory and cache.

Exposes accessors to all `CeloContract` web3 contracts.

Mostly a private cache, kit users would normally use a contract wrapper

## Hierarchy

* **Web3ContractCache**

## Index

### Constructors

* [constructor]()

### Properties

* [kit]()

### Methods

* [getAccounts]()
* [getAttestations]()
* [getBlockchainParameters]()
* [getContract]()
* [getDoubleSigningSlasher]()
* [getDowntimeSlasher]()
* [getElection]()
* [getEpochRewards]()
* [getEscrow]()
* [getExchange]()
* [getFeeCurrencyWhitelist]()
* [getFreezer]()
* [getGasPriceMinimum]()
* [getGoldToken]()
* [getGovernance]()
* [getLockedGold]()
* [getMultiSig]()
* [getRandom]()
* [getRegistry]()
* [getReserve]()
* [getSortedOracles]()
* [getStableToken]()
* [getTransferWhitelist]()
* [getValidators]()

## Constructors

### constructor

+ **new Web3ContractCache**\(`kit`: [ContractKit]()\): [_Web3ContractCache_]()

_Defined in_ [_contractkit/src/web3-contract-cache.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L69)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |

**Returns:** [_Web3ContractCache_]()

## Properties

### kit

• **kit**: [_ContractKit_]()

_Defined in_ [_contractkit/src/web3-contract-cache.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L71)

## Methods

### getAccounts

▸ **getAccounts**\(\): _Promise‹Accounts‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L72)

**Returns:** _Promise‹Accounts‹››_

### getAttestations

▸ **getAttestations**\(\): _Promise‹Attestations‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:75_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L75)

**Returns:** _Promise‹Attestations‹››_

### getBlockchainParameters

▸ **getBlockchainParameters**\(\): _Promise‹BlockchainParameters‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:78_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L78)

**Returns:** _Promise‹BlockchainParameters‹››_

### getContract

▸ **getContract**&lt;**C**&gt;\(`contract`: C, `address?`: undefined \| string\): _Promise‹ContractCacheMap\[C\] extends undefined \| null ? never : ContractCacheMap\[C\]›_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:145_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L145)

Get native web3 contract wrapper

**Type parameters:**

▪ **C**: _keyof typeof ContractFactories_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `contract` | C |
| `address?` | undefined \| string |

**Returns:** _Promise‹ContractCacheMap\[C\] extends undefined \| null ? never : ContractCacheMap\[C\]›_

### getDoubleSigningSlasher

▸ **getDoubleSigningSlasher**\(\): _Promise‹DoubleSigningSlasher‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:81_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L81)

**Returns:** _Promise‹DoubleSigningSlasher‹››_

### getDowntimeSlasher

▸ **getDowntimeSlasher**\(\): _Promise‹DowntimeSlasher‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:84_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L84)

**Returns:** _Promise‹DowntimeSlasher‹››_

### getElection

▸ **getElection**\(\): _Promise‹Election‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:87_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L87)

**Returns:** _Promise‹Election‹››_

### getEpochRewards

▸ **getEpochRewards**\(\): _Promise‹EpochRewards‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:90_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L90)

**Returns:** _Promise‹EpochRewards‹››_

### getEscrow

▸ **getEscrow**\(\): _Promise‹Escrow‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L93)

**Returns:** _Promise‹Escrow‹››_

### getExchange

▸ **getExchange**\(\): _Promise‹Exchange‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:96_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L96)

**Returns:** _Promise‹Exchange‹››_

### getFeeCurrencyWhitelist

▸ **getFeeCurrencyWhitelist**\(\): _Promise‹FeeCurrencyWhitelist‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L99)

**Returns:** _Promise‹FeeCurrencyWhitelist‹››_

### getFreezer

▸ **getFreezer**\(\): _Promise‹Freezer‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:102_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L102)

**Returns:** _Promise‹Freezer‹››_

### getGasPriceMinimum

▸ **getGasPriceMinimum**\(\): _Promise‹GasPriceMinimum‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:105_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L105)

**Returns:** _Promise‹GasPriceMinimum‹››_

### getGoldToken

▸ **getGoldToken**\(\): _Promise‹GoldToken‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:108_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L108)

**Returns:** _Promise‹GoldToken‹››_

### getGovernance

▸ **getGovernance**\(\): _Promise‹Governance‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:111_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L111)

**Returns:** _Promise‹Governance‹››_

### getLockedGold

▸ **getLockedGold**\(\): _Promise‹LockedGold‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:114_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L114)

**Returns:** _Promise‹LockedGold‹››_

### getMultiSig

▸ **getMultiSig**\(`address`: string\): _Promise‹MultiSig‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L117)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹MultiSig‹››_

### getRandom

▸ **getRandom**\(\): _Promise‹Random‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L120)

**Returns:** _Promise‹Random‹››_

### getRegistry

▸ **getRegistry**\(\): _Promise‹Registry‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:123_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L123)

**Returns:** _Promise‹Registry‹››_

### getReserve

▸ **getReserve**\(\): _Promise‹Reserve‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:126_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L126)

**Returns:** _Promise‹Reserve‹››_

### getSortedOracles

▸ **getSortedOracles**\(\): _Promise‹SortedOracles‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:129_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L129)

**Returns:** _Promise‹SortedOracles‹››_

### getStableToken

▸ **getStableToken**\(\): _Promise‹StableToken‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:132_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L132)

**Returns:** _Promise‹StableToken‹››_

### getTransferWhitelist

▸ **getTransferWhitelist**\(\): _Promise‹TransferWhitelist‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:135_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L135)

**Returns:** _Promise‹TransferWhitelist‹››_

### getValidators

▸ **getValidators**\(\): _Promise‹Validators‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:138_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L138)

**Returns:** _Promise‹Validators‹››_

