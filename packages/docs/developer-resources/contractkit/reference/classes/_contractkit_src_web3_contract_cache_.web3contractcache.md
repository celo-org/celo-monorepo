# Class: Web3ContractCache

Native Web3 contracts factory and cache.

Exposes accessors to all `CeloContract` web3 contracts.

Mostly a private cache, kit users would normally use
a contract wrapper

## Hierarchy

* **Web3ContractCache**

## Index

### Constructors

* [constructor](_contractkit_src_web3_contract_cache_.web3contractcache.md#constructor)

### Properties

* [kit](_contractkit_src_web3_contract_cache_.web3contractcache.md#kit)

### Methods

* [getAccounts](_contractkit_src_web3_contract_cache_.web3contractcache.md#getaccounts)
* [getAttestations](_contractkit_src_web3_contract_cache_.web3contractcache.md#getattestations)
* [getBlockchainParameters](_contractkit_src_web3_contract_cache_.web3contractcache.md#getblockchainparameters)
* [getContract](_contractkit_src_web3_contract_cache_.web3contractcache.md#getcontract)
* [getDoubleSigningSlasher](_contractkit_src_web3_contract_cache_.web3contractcache.md#getdoublesigningslasher)
* [getDowntimeSlasher](_contractkit_src_web3_contract_cache_.web3contractcache.md#getdowntimeslasher)
* [getElection](_contractkit_src_web3_contract_cache_.web3contractcache.md#getelection)
* [getEpochRewards](_contractkit_src_web3_contract_cache_.web3contractcache.md#getepochrewards)
* [getEscrow](_contractkit_src_web3_contract_cache_.web3contractcache.md#getescrow)
* [getExchange](_contractkit_src_web3_contract_cache_.web3contractcache.md#getexchange)
* [getFeeCurrencyWhitelist](_contractkit_src_web3_contract_cache_.web3contractcache.md#getfeecurrencywhitelist)
* [getFreezer](_contractkit_src_web3_contract_cache_.web3contractcache.md#getfreezer)
* [getGasPriceMinimum](_contractkit_src_web3_contract_cache_.web3contractcache.md#getgaspriceminimum)
* [getGoldToken](_contractkit_src_web3_contract_cache_.web3contractcache.md#getgoldtoken)
* [getGovernance](_contractkit_src_web3_contract_cache_.web3contractcache.md#getgovernance)
* [getLockedGold](_contractkit_src_web3_contract_cache_.web3contractcache.md#getlockedgold)
* [getMultiSig](_contractkit_src_web3_contract_cache_.web3contractcache.md#getmultisig)
* [getRandom](_contractkit_src_web3_contract_cache_.web3contractcache.md#getrandom)
* [getRegistry](_contractkit_src_web3_contract_cache_.web3contractcache.md#getregistry)
* [getReserve](_contractkit_src_web3_contract_cache_.web3contractcache.md#getreserve)
* [getSortedOracles](_contractkit_src_web3_contract_cache_.web3contractcache.md#getsortedoracles)
* [getStableToken](_contractkit_src_web3_contract_cache_.web3contractcache.md#getstabletoken)
* [getTransferWhitelist](_contractkit_src_web3_contract_cache_.web3contractcache.md#gettransferwhitelist)
* [getValidators](_contractkit_src_web3_contract_cache_.web3contractcache.md#getvalidators)

## Constructors

###  constructor

\+ **new Web3ContractCache**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md)): *[Web3ContractCache](_contractkit_src_web3_contract_cache_.web3contractcache.md)*

*Defined in [contractkit/src/web3-contract-cache.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L68)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |

**Returns:** *[Web3ContractCache](_contractkit_src_web3_contract_cache_.web3contractcache.md)*

## Properties

###  kit

• **kit**: *[ContractKit](_contractkit_src_kit_.contractkit.md)*

*Defined in [contractkit/src/web3-contract-cache.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L70)*

## Methods

###  getAccounts

▸ **getAccounts**(): *Promise‹Accounts‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L71)*

**Returns:** *Promise‹Accounts‹››*

___

###  getAttestations

▸ **getAttestations**(): *Promise‹Attestations‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L74)*

**Returns:** *Promise‹Attestations‹››*

___

###  getBlockchainParameters

▸ **getBlockchainParameters**(): *Promise‹BlockchainParameters‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L77)*

**Returns:** *Promise‹BlockchainParameters‹››*

___

###  getContract

▸ **getContract**<**C**>(`contract`: C, `address?`: undefined | string): *Promise‹ContractCacheMap[C] extends undefined | null ? never : ContractCacheMap[C]›*

*Defined in [contractkit/src/web3-contract-cache.ts:144](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L144)*

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

*Defined in [contractkit/src/web3-contract-cache.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L80)*

**Returns:** *Promise‹DoubleSigningSlasher‹››*

___

###  getDowntimeSlasher

▸ **getDowntimeSlasher**(): *Promise‹DowntimeSlasher‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L83)*

**Returns:** *Promise‹DowntimeSlasher‹››*

___

###  getElection

▸ **getElection**(): *Promise‹Election‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L86)*

**Returns:** *Promise‹Election‹››*

___

###  getEpochRewards

▸ **getEpochRewards**(): *Promise‹EpochRewards‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L89)*

**Returns:** *Promise‹EpochRewards‹››*

___

###  getEscrow

▸ **getEscrow**(): *Promise‹Escrow‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:92](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L92)*

**Returns:** *Promise‹Escrow‹››*

___

###  getExchange

▸ **getExchange**(): *Promise‹Exchange‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:95](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L95)*

**Returns:** *Promise‹Exchange‹››*

___

###  getFeeCurrencyWhitelist

▸ **getFeeCurrencyWhitelist**(): *Promise‹FeeCurrencyWhitelist‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L98)*

**Returns:** *Promise‹FeeCurrencyWhitelist‹››*

___

###  getFreezer

▸ **getFreezer**(): *Promise‹Freezer‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L101)*

**Returns:** *Promise‹Freezer‹››*

___

###  getGasPriceMinimum

▸ **getGasPriceMinimum**(): *Promise‹GasPriceMinimum‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L104)*

**Returns:** *Promise‹GasPriceMinimum‹››*

___

###  getGoldToken

▸ **getGoldToken**(): *Promise‹GoldToken‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:107](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L107)*

**Returns:** *Promise‹GoldToken‹››*

___

###  getGovernance

▸ **getGovernance**(): *Promise‹Governance‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L110)*

**Returns:** *Promise‹Governance‹››*

___

###  getLockedGold

▸ **getLockedGold**(): *Promise‹LockedGold‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:113](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L113)*

**Returns:** *Promise‹LockedGold‹››*

___

###  getMultiSig

▸ **getMultiSig**(`address`: string): *Promise‹MultiSig‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:116](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L116)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹MultiSig‹››*

___

###  getRandom

▸ **getRandom**(): *Promise‹Random‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:119](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L119)*

**Returns:** *Promise‹Random‹››*

___

###  getRegistry

▸ **getRegistry**(): *Promise‹Registry‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:122](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L122)*

**Returns:** *Promise‹Registry‹››*

___

###  getReserve

▸ **getReserve**(): *Promise‹Reserve‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:125](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L125)*

**Returns:** *Promise‹Reserve‹››*

___

###  getSortedOracles

▸ **getSortedOracles**(): *Promise‹SortedOracles‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L128)*

**Returns:** *Promise‹SortedOracles‹››*

___

###  getStableToken

▸ **getStableToken**(): *Promise‹StableToken‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:131](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L131)*

**Returns:** *Promise‹StableToken‹››*

___

###  getTransferWhitelist

▸ **getTransferWhitelist**(): *Promise‹TransferWhitelist‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L134)*

**Returns:** *Promise‹TransferWhitelist‹››*

___

###  getValidators

▸ **getValidators**(): *Promise‹Validators‹››*

*Defined in [contractkit/src/web3-contract-cache.ts:137](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L137)*

**Returns:** *Promise‹Validators‹››*
