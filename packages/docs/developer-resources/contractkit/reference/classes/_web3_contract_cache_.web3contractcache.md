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

###  constructor

\+ **new Web3ContractCache**(`kit`: [ContractKit](_kit_.contractkit.md)): *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [web3-contract-cache.ts:73](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

## Properties

### `Readonly` kit

• **kit**: *[ContractKit](_kit_.contractkit.md)*

*Defined in [web3-contract-cache.ts:75](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L75)*

## Methods

###  getAccounts

▸ **getAccounts**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:76](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L76)*

**Returns:** *Promise‹any›*

___

###  getAttestations

▸ **getAttestations**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:79](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L79)*

**Returns:** *Promise‹any›*

___

###  getBlockchainParameters

▸ **getBlockchainParameters**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:82](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L82)*

**Returns:** *Promise‹any›*

___

###  getContract

▸ **getContract**<**C**>(`contract`: C, `address?`: undefined | string): *Promise‹NonNullable‹ContractCacheMap[C]››*

*Defined in [web3-contract-cache.ts:155](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L155)*

Get native web3 contract wrapper

**Type parameters:**

▪ **C**: *keyof typeof ContractFactories*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | C |
`address?` | undefined &#124; string |

**Returns:** *Promise‹NonNullable‹ContractCacheMap[C]››*

___

###  getDoubleSigningSlasher

▸ **getDoubleSigningSlasher**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:85](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L85)*

**Returns:** *Promise‹any›*

___

###  getDowntimeSlasher

▸ **getDowntimeSlasher**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:88](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L88)*

**Returns:** *Promise‹any›*

___

###  getElection

▸ **getElection**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:91](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L91)*

**Returns:** *Promise‹any›*

___

###  getEpochRewards

▸ **getEpochRewards**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:94](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L94)*

**Returns:** *Promise‹any›*

___

###  getEscrow

▸ **getEscrow**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:97](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L97)*

**Returns:** *Promise‹any›*

___

###  getExchange

▸ **getExchange**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:100](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L100)*

**Returns:** *Promise‹any›*

___

###  getFeeCurrencyWhitelist

▸ **getFeeCurrencyWhitelist**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:103](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L103)*

**Returns:** *Promise‹any›*

___

###  getFreezer

▸ **getFreezer**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:106](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L106)*

**Returns:** *Promise‹any›*

___

###  getGasPriceMinimum

▸ **getGasPriceMinimum**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:109](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L109)*

**Returns:** *Promise‹any›*

___

###  getGoldToken

▸ **getGoldToken**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:112](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L112)*

**Returns:** *Promise‹any›*

___

###  getGovernance

▸ **getGovernance**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:115](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L115)*

**Returns:** *Promise‹any›*

___

###  getLockedGold

▸ **getLockedGold**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:118](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L118)*

**Returns:** *Promise‹any›*

___

###  getMetaTransactionWallet

▸ **getMetaTransactionWallet**(`address`: string): *Promise‹any›*

*Defined in [web3-contract-cache.ts:121](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L121)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹any›*

___

###  getMetaTransactionWalletDeployer

▸ **getMetaTransactionWalletDeployer**(`address`: string): *Promise‹any›*

*Defined in [web3-contract-cache.ts:124](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L124)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹any›*

___

###  getMultiSig

▸ **getMultiSig**(`address`: string): *Promise‹any›*

*Defined in [web3-contract-cache.ts:127](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L127)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹any›*

___

###  getRandom

▸ **getRandom**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:130](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L130)*

**Returns:** *Promise‹any›*

___

###  getRegistry

▸ **getRegistry**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:133](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L133)*

**Returns:** *Promise‹any›*

___

###  getReserve

▸ **getReserve**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:136](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L136)*

**Returns:** *Promise‹any›*

___

###  getSortedOracles

▸ **getSortedOracles**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:139](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L139)*

**Returns:** *Promise‹any›*

___

###  getStableToken

▸ **getStableToken**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:142](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L142)*

**Returns:** *Promise‹any›*

___

###  getTransferWhitelist

▸ **getTransferWhitelist**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:145](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L145)*

**Returns:** *Promise‹any›*

___

###  getValidators

▸ **getValidators**(): *Promise‹any›*

*Defined in [web3-contract-cache.ts:148](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/web3-contract-cache.ts#L148)*

**Returns:** *Promise‹any›*
