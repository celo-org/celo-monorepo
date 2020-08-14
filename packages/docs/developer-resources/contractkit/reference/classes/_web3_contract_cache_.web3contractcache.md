# Class: Web3ContractCache

Native Web3 contracts factory and cache.

Exposes accessors to all `CeloContract` web3 contracts.

Mostly a private cache, kit users would normally use
a contract wrapper

## Hierarchy

* **Web3ContractCache**

## Index

### Constructors

* [constructor](_web3_contract_cache_.web3contractcache.md#constructor)

### Properties

* [kit](_web3_contract_cache_.web3contractcache.md#kit)

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
* [getMultiSig](_web3_contract_cache_.web3contractcache.md#getmultisig)
* [getRandom](_web3_contract_cache_.web3contractcache.md#getrandom)
* [getRegistry](_web3_contract_cache_.web3contractcache.md#getregistry)
* [getReserve](_web3_contract_cache_.web3contractcache.md#getreserve)
* [getSortedOracles](_web3_contract_cache_.web3contractcache.md#getsortedoracles)
* [getStableToken](_web3_contract_cache_.web3contractcache.md#getstabletoken)
* [getTransferWhitelist](_web3_contract_cache_.web3contractcache.md#gettransferwhitelist)
* [getValidators](_web3_contract_cache_.web3contractcache.md#getvalidators)

## Constructors

###  constructor

\+ **new Web3ContractCache**(`kit`: [ContractKit](_kit_.contractkit.md)): *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [contractkit/src/web3-contract-cache.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

## Properties

###  kit

• **kit**: *[ContractKit](_kit_.contractkit.md)*

*Defined in [contractkit/src/web3-contract-cache.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L71)*

## Methods

###  getAccounts

▸ **getAccounts**(): *Promise‹Accounts‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L72)*

**Returns:** *Promise‹Accounts‹››*

___

###  getAttestations

▸ **getAttestations**(): *Promise‹Attestations‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L75)*

**Returns:** *Promise‹Attestations‹››*

___

###  getBlockchainParameters

▸ **getBlockchainParameters**(): *Promise‹BlockchainParameters‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L78)*

**Returns:** *Promise‹BlockchainParameters‹››*

___

###  getContract

▸ **getContract**<**C**>(`contract`: C, `address?`: undefined | string): *Promise‹ContractCacheMap[C] extends undefined | null ? never : ContractCacheMap[C]›*

*Defined in [contractkit/src/web3-contract-cache.ts:145](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L145)*

Get native web3 contract wrapper

**Type parameters:**

▪ **C**: *keyof typeof ContractFactories*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | C |
`address?` | undefined &#124; string |

**Returns:** *Promise‹ContractCacheMap[C] extends undefined | null ? never : ContractCacheMap[C]›*

___

###  getDoubleSigningSlasher

▸ **getDoubleSigningSlasher**(): *Promise‹DoubleSigningSlasher‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L81)*

**Returns:** *Promise‹DoubleSigningSlasher‹››*

___

###  getDowntimeSlasher

▸ **getDowntimeSlasher**(): *Promise‹DowntimeSlasher‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L84)*

**Returns:** *Promise‹DowntimeSlasher‹››*

___

###  getElection

▸ **getElection**(): *Promise‹Election‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L87)*

**Returns:** *Promise‹Election‹››*

___

###  getEpochRewards

▸ **getEpochRewards**(): *Promise‹EpochRewards‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L90)*

**Returns:** *Promise‹EpochRewards‹››*

___

###  getEscrow

▸ **getEscrow**(): *Promise‹Escrow‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L93)*

**Returns:** *Promise‹Escrow‹››*

___

###  getExchange

▸ **getExchange**(): *Promise‹Exchange‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:96](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L96)*

**Returns:** *Promise‹Exchange‹››*

___

###  getFeeCurrencyWhitelist

▸ **getFeeCurrencyWhitelist**(): *Promise‹FeeCurrencyWhitelist‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L99)*

**Returns:** *Promise‹FeeCurrencyWhitelist‹››*

___

###  getFreezer

▸ **getFreezer**(): *Promise‹Freezer‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L102)*

**Returns:** *Promise‹Freezer‹››*

___

###  getGasPriceMinimum

▸ **getGasPriceMinimum**(): *Promise‹GasPriceMinimum‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L105)*

**Returns:** *Promise‹GasPriceMinimum‹››*

___

###  getGoldToken

▸ **getGoldToken**(): *Promise‹GoldToken‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:108](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L108)*

**Returns:** *Promise‹GoldToken‹››*

___

###  getGovernance

▸ **getGovernance**(): *Promise‹Governance‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L111)*

**Returns:** *Promise‹Governance‹››*

___

###  getLockedGold

▸ **getLockedGold**(): *Promise‹LockedGold‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L114)*

**Returns:** *Promise‹LockedGold‹››*

___

###  getMultiSig

▸ **getMultiSig**(`address`: string): *Promise‹MultiSig‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L117)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹MultiSig‹››*

___

###  getRandom

▸ **getRandom**(): *Promise‹Random‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L120)*

**Returns:** *Promise‹Random‹››*

___

###  getRegistry

▸ **getRegistry**(): *Promise‹Registry‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L123)*

**Returns:** *Promise‹Registry‹››*

___

###  getReserve

▸ **getReserve**(): *Promise‹Reserve‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:126](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L126)*

**Returns:** *Promise‹Reserve‹››*

___

###  getSortedOracles

▸ **getSortedOracles**(): *Promise‹SortedOracles‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:129](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L129)*

**Returns:** *Promise‹SortedOracles‹››*

___

###  getStableToken

▸ **getStableToken**(): *Promise‹StableToken‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:132](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L132)*

**Returns:** *Promise‹StableToken‹››*

___

###  getTransferWhitelist

▸ **getTransferWhitelist**(): *Promise‹TransferWhitelist‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:135](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L135)*

**Returns:** *Promise‹TransferWhitelist‹››*

___

###  getValidators

▸ **getValidators**(): *Promise‹Validators‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:138](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L138)*

**Returns:** *Promise‹Validators‹››*
