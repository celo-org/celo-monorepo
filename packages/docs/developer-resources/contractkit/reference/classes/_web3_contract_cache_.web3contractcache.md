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

*Defined in [packages/contractkit/src/web3-contract-cache.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

## Properties

### `Readonly` kit

• **kit**: *[ContractKit](_kit_.contractkit.md)*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L75)*

## Methods

###  getAccounts

▸ **getAccounts**(): *Promise‹Accounts‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:76](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L76)*

**Returns:** *Promise‹Accounts‹››*

___

###  getAttestations

▸ **getAttestations**(): *Promise‹Attestations‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L79)*

**Returns:** *Promise‹Attestations‹››*

___

###  getBlockchainParameters

▸ **getBlockchainParameters**(): *Promise‹BlockchainParameters‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L82)*

**Returns:** *Promise‹BlockchainParameters‹››*

___

###  getContract

▸ **getContract**<**C**>(`contract`: C, `address?`: undefined | string): *Promise‹NonNullable‹ContractCacheMap[C]››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:155](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L155)*

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

▸ **getDoubleSigningSlasher**(): *Promise‹DoubleSigningSlasher‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L85)*

**Returns:** *Promise‹DoubleSigningSlasher‹››*

___

###  getDowntimeSlasher

▸ **getDowntimeSlasher**(): *Promise‹DowntimeSlasher‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L88)*

**Returns:** *Promise‹DowntimeSlasher‹››*

___

###  getElection

▸ **getElection**(): *Promise‹Election‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:91](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L91)*

**Returns:** *Promise‹Election‹››*

___

###  getEpochRewards

▸ **getEpochRewards**(): *Promise‹EpochRewards‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L94)*

**Returns:** *Promise‹EpochRewards‹››*

___

###  getEscrow

▸ **getEscrow**(): *Promise‹Escrow‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L97)*

**Returns:** *Promise‹Escrow‹››*

___

###  getExchange

▸ **getExchange**(): *Promise‹Exchange‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L100)*

**Returns:** *Promise‹Exchange‹››*

___

###  getFeeCurrencyWhitelist

▸ **getFeeCurrencyWhitelist**(): *Promise‹FeeCurrencyWhitelist‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:103](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L103)*

**Returns:** *Promise‹FeeCurrencyWhitelist‹››*

___

###  getFreezer

▸ **getFreezer**(): *Promise‹Freezer‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L106)*

**Returns:** *Promise‹Freezer‹››*

___

###  getGasPriceMinimum

▸ **getGasPriceMinimum**(): *Promise‹GasPriceMinimum‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:109](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L109)*

**Returns:** *Promise‹GasPriceMinimum‹››*

___

###  getGoldToken

▸ **getGoldToken**(): *Promise‹GoldToken‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:112](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L112)*

**Returns:** *Promise‹GoldToken‹››*

___

###  getGovernance

▸ **getGovernance**(): *Promise‹Governance‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L115)*

**Returns:** *Promise‹Governance‹››*

___

###  getLockedGold

▸ **getLockedGold**(): *Promise‹LockedGold‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L118)*

**Returns:** *Promise‹LockedGold‹››*

___

###  getMetaTransactionWallet

▸ **getMetaTransactionWallet**(`address`: string): *Promise‹MetaTransactionWallet‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L121)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹MetaTransactionWallet‹››*

___

###  getMetaTransactionWalletDeployer

▸ **getMetaTransactionWalletDeployer**(`address`: string): *Promise‹MetaTransactionWalletDeployer‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:124](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L124)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹MetaTransactionWalletDeployer‹››*

___

###  getMultiSig

▸ **getMultiSig**(`address`: string): *Promise‹MultiSig‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:127](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L127)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹MultiSig‹››*

___

###  getRandom

▸ **getRandom**(): *Promise‹Random‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:130](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L130)*

**Returns:** *Promise‹Random‹››*

___

###  getRegistry

▸ **getRegistry**(): *Promise‹Registry‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:133](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L133)*

**Returns:** *Promise‹Registry‹››*

___

###  getReserve

▸ **getReserve**(): *Promise‹Reserve‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:136](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L136)*

**Returns:** *Promise‹Reserve‹››*

___

###  getSortedOracles

▸ **getSortedOracles**(): *Promise‹SortedOracles‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:139](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L139)*

**Returns:** *Promise‹SortedOracles‹››*

___

###  getStableToken

▸ **getStableToken**(): *Promise‹StableToken‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:142](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L142)*

**Returns:** *Promise‹StableToken‹››*

___

###  getTransferWhitelist

▸ **getTransferWhitelist**(): *Promise‹TransferWhitelist‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:145](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L145)*

**Returns:** *Promise‹TransferWhitelist‹››*

___

###  getValidators

▸ **getValidators**(): *Promise‹Validators‹››*

*Defined in [packages/contractkit/src/web3-contract-cache.ts:148](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/web3-contract-cache.ts#L148)*

**Returns:** *Promise‹Validators‹››*
