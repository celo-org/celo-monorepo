# Web3ContractCache

Native Web3 contracts factory and cache.

Exposes accessors to all `CeloContract` web3 contracts.

Mostly a private cache, kit users would normally use a contract wrapper

## Hierarchy

* **Web3ContractCache**

## Index

### Constructors

* [constructor](_web3_contract_cache_.web3contractcache.md#constructor)

### Properties

* [kit](_web3_contract_cache_.web3contractcache.md#readonly-kit)

### Methods

* [getAccounts](_web3_contract_cache_.web3contractcache.md#getaccounts)
* [getAttestations](_web3_contract_cache_.web3contractcache.md#getattestations)
* [getBlockchainParameters](_web3_contract_cache_.web3contractcache.md#getblockchainparameters)
* [getContract](_web3_contract_cache_.web3contractcache.md#getcontract)
* [getDoubleSigningSlasher](_web3_contract_cache_.web3contractcache.md#getdoublesigningslasher)
* [getDowntimeSlasher](_web3_contract_cache_.web3contractcache.md#getdowntimeslasher)
* [getElection](_web3_contract_cache_.web3contractcache.md#getelection)
* [getEpochRewards](_web3_contract_cache_.web3contractcache.md#getepochrewards)
* [getEscrow](_web3_contract_cache_.web3contractcache.md#getescrow)
* [getExchange](_web3_contract_cache_.web3contractcache.md#getexchange)
* [getFeeCurrencyWhitelist](_web3_contract_cache_.web3contractcache.md#getfeecurrencywhitelist)
* [getFreezer](_web3_contract_cache_.web3contractcache.md#getfreezer)
* [getGasPriceMinimum](_web3_contract_cache_.web3contractcache.md#getgaspriceminimum)
* [getGoldToken](_web3_contract_cache_.web3contractcache.md#getgoldtoken)
* [getGovernance](_web3_contract_cache_.web3contractcache.md#getgovernance)
* [getLockedGold](_web3_contract_cache_.web3contractcache.md#getlockedgold)
* [getMetaTransactionWallet](_web3_contract_cache_.web3contractcache.md#getmetatransactionwallet)
* [getMetaTransactionWalletDeployer](_web3_contract_cache_.web3contractcache.md#getmetatransactionwalletdeployer)
* [getMultiSig](_web3_contract_cache_.web3contractcache.md#getmultisig)
* [getRandom](_web3_contract_cache_.web3contractcache.md#getrandom)
* [getRegistry](_web3_contract_cache_.web3contractcache.md#getregistry)
* [getReserve](_web3_contract_cache_.web3contractcache.md#getreserve)
* [getSortedOracles](_web3_contract_cache_.web3contractcache.md#getsortedoracles)
* [getStableToken](_web3_contract_cache_.web3contractcache.md#getstabletoken)
* [getTransferWhitelist](_web3_contract_cache_.web3contractcache.md#gettransferwhitelist)
* [getValidators](_web3_contract_cache_.web3contractcache.md#getvalidators)

## Constructors

### constructor

+ **new Web3ContractCache**\(`kit`: [ContractKit](_kit_.contractkit.md)\): [_Web3ContractCache_](_web3_contract_cache_.web3contractcache.md)

_Defined in_ [_contractkit/src/web3-contract-cache.ts:73_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L73)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** [_Web3ContractCache_](_web3_contract_cache_.web3contractcache.md)

## Properties

### `Readonly` kit

• **kit**: [_ContractKit_](_kit_.contractkit.md)

_Defined in_ [_contractkit/src/web3-contract-cache.ts:75_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L75)

## Methods

### getAccounts

▸ **getAccounts**\(\): _Promise‹Accounts‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:76_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L76)

**Returns:** _Promise‹Accounts‹››_

### getAttestations

▸ **getAttestations**\(\): _Promise‹Attestations‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:79_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L79)

**Returns:** _Promise‹Attestations‹››_

### getBlockchainParameters

▸ **getBlockchainParameters**\(\): _Promise‹BlockchainParameters‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:82_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L82)

**Returns:** _Promise‹BlockchainParameters‹››_

### getContract

▸ **getContract**&lt;**C**&gt;\(`contract`: C, `address?`: undefined \| string\): _Promise‹NonNullable‹ContractCacheMap\[C\]››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:155_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L155)

Get native web3 contract wrapper

**Type parameters:**

▪ **C**: _keyof typeof ContractFactories_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `contract` | C |
| `address?` | undefined \| string |

**Returns:** _Promise‹NonNullable‹ContractCacheMap\[C\]››_

### getDoubleSigningSlasher

▸ **getDoubleSigningSlasher**\(\): _Promise‹DoubleSigningSlasher‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:85_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L85)

**Returns:** _Promise‹DoubleSigningSlasher‹››_

### getDowntimeSlasher

▸ **getDowntimeSlasher**\(\): _Promise‹DowntimeSlasher‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:88_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L88)

**Returns:** _Promise‹DowntimeSlasher‹››_

### getElection

▸ **getElection**\(\): _Promise‹Election‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:91_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L91)

**Returns:** _Promise‹Election‹››_

### getEpochRewards

▸ **getEpochRewards**\(\): _Promise‹EpochRewards‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:94_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L94)

**Returns:** _Promise‹EpochRewards‹››_

### getEscrow

▸ **getEscrow**\(\): _Promise‹Escrow‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:97_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L97)

**Returns:** _Promise‹Escrow‹››_

### getExchange

▸ **getExchange**\(\): _Promise‹Exchange‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:100_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L100)

**Returns:** _Promise‹Exchange‹››_

### getFeeCurrencyWhitelist

▸ **getFeeCurrencyWhitelist**\(\): _Promise‹FeeCurrencyWhitelist‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:103_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L103)

**Returns:** _Promise‹FeeCurrencyWhitelist‹››_

### getFreezer

▸ **getFreezer**\(\): _Promise‹Freezer‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:106_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L106)

**Returns:** _Promise‹Freezer‹››_

### getGasPriceMinimum

▸ **getGasPriceMinimum**\(\): _Promise‹GasPriceMinimum‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:109_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L109)

**Returns:** _Promise‹GasPriceMinimum‹››_

### getGoldToken

▸ **getGoldToken**\(\): _Promise‹GoldToken‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:112_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L112)

**Returns:** _Promise‹GoldToken‹››_

### getGovernance

▸ **getGovernance**\(\): _Promise‹Governance‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:115_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L115)

**Returns:** _Promise‹Governance‹››_

### getLockedGold

▸ **getLockedGold**\(\): _Promise‹LockedGold‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:118_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L118)

**Returns:** _Promise‹LockedGold‹››_

### getMetaTransactionWallet

▸ **getMetaTransactionWallet**\(`address`: string\): _Promise‹MetaTransactionWallet‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:121_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L121)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹MetaTransactionWallet‹››_

### getMetaTransactionWalletDeployer

▸ **getMetaTransactionWalletDeployer**\(`address`: string\): _Promise‹MetaTransactionWalletDeployer‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:124_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L124)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹MetaTransactionWalletDeployer‹››_

### getMultiSig

▸ **getMultiSig**\(`address`: string\): _Promise‹MultiSig‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:127_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L127)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹MultiSig‹››_

### getRandom

▸ **getRandom**\(\): _Promise‹Random‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:130_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L130)

**Returns:** _Promise‹Random‹››_

### getRegistry

▸ **getRegistry**\(\): _Promise‹Registry‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:133_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L133)

**Returns:** _Promise‹Registry‹››_

### getReserve

▸ **getReserve**\(\): _Promise‹Reserve‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:136_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L136)

**Returns:** _Promise‹Reserve‹››_

### getSortedOracles

▸ **getSortedOracles**\(\): _Promise‹SortedOracles‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:139_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L139)

**Returns:** _Promise‹SortedOracles‹››_

### getStableToken

▸ **getStableToken**\(\): _Promise‹StableToken‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:142_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L142)

**Returns:** _Promise‹StableToken‹››_

### getTransferWhitelist

▸ **getTransferWhitelist**\(\): _Promise‹TransferWhitelist‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:145_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L145)

**Returns:** _Promise‹TransferWhitelist‹››_

### getValidators

▸ **getValidators**\(\): _Promise‹Validators‹››_

_Defined in_ [_contractkit/src/web3-contract-cache.ts:148_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L148)

**Returns:** _Promise‹Validators‹››_

