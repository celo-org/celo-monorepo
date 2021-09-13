[@celo/contractkit](../README.md) › ["contract-cache"](../modules/_contract_cache_.md) › [WrapperCache](_contract_cache_.wrappercache.md)

# Class: WrapperCache

Kit ContractWrappers factory & cache.

Provides access to all contract wrappers for celo core contracts

## Hierarchy

* **WrapperCache**

## Index

### Constructors

* [constructor](_contract_cache_.wrappercache.md#constructor)

### Properties

* [kit](_contract_cache_.wrappercache.md#readonly-kit)

### Methods

* [getAccounts](_contract_cache_.wrappercache.md#getaccounts)
* [getAttestations](_contract_cache_.wrappercache.md#getattestations)
* [getBlockchainParameters](_contract_cache_.wrappercache.md#getblockchainparameters)
* [getContract](_contract_cache_.wrappercache.md#getcontract)
* [getDoubleSigningSlasher](_contract_cache_.wrappercache.md#getdoublesigningslasher)
* [getDowntimeSlasher](_contract_cache_.wrappercache.md#getdowntimeslasher)
* [getElection](_contract_cache_.wrappercache.md#getelection)
* [getErc20](_contract_cache_.wrappercache.md#geterc20)
* [getEscrow](_contract_cache_.wrappercache.md#getescrow)
* [getExchange](_contract_cache_.wrappercache.md#getexchange)
* [getFreezer](_contract_cache_.wrappercache.md#getfreezer)
* [getGasPriceMinimum](_contract_cache_.wrappercache.md#getgaspriceminimum)
* [getGoldToken](_contract_cache_.wrappercache.md#getgoldtoken)
* [getGovernance](_contract_cache_.wrappercache.md#getgovernance)
* [getGrandaMento](_contract_cache_.wrappercache.md#getgrandamento)
* [getLockedGold](_contract_cache_.wrappercache.md#getlockedgold)
* [getMetaTransactionWallet](_contract_cache_.wrappercache.md#getmetatransactionwallet)
* [getMetaTransactionWalletDeployer](_contract_cache_.wrappercache.md#getmetatransactionwalletdeployer)
* [getMultiSig](_contract_cache_.wrappercache.md#getmultisig)
* [getReserve](_contract_cache_.wrappercache.md#getreserve)
* [getSortedOracles](_contract_cache_.wrappercache.md#getsortedoracles)
* [getStableToken](_contract_cache_.wrappercache.md#getstabletoken)
* [getValidators](_contract_cache_.wrappercache.md#getvalidators)
* [invalidateContract](_contract_cache_.wrappercache.md#invalidatecontract)

## Constructors

###  constructor

\+ **new WrapperCache**(`kit`: [ContractKit](_kit_.contractkit.md)): *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *[WrapperCache](_contract_cache_.wrappercache.md)*

## Properties

### `Readonly` kit

• **kit**: *[ContractKit](_kit_.contractkit.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L102)*

## Methods

###  getAccounts

▸ **getAccounts**(): *Promise‹[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L104)*

**Returns:** *Promise‹[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)‹››*

___

###  getAttestations

▸ **getAttestations**(): *Promise‹[AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:107](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L107)*

**Returns:** *Promise‹[AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)‹››*

___

###  getBlockchainParameters

▸ **getBlockchainParameters**(): *Promise‹[BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L110)*

**Returns:** *Promise‹[BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)‹››*

___

###  getContract

▸ **getContract**<**C**>(`contract`: C, `address?`: undefined | string): *Promise‹NonNullable‹WrapperCacheMap[C]››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:183](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L183)*

Get Contract wrapper

**Type parameters:**

▪ **C**: *[ValidWrappers](../modules/_contract_cache_.md#validwrappers)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | C |
`address?` | undefined &#124; string |

**Returns:** *Promise‹NonNullable‹WrapperCacheMap[C]››*

___

###  getDoubleSigningSlasher

▸ **getDoubleSigningSlasher**(): *Promise‹[DoubleSigningSlasherWrapper](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:113](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L113)*

**Returns:** *Promise‹[DoubleSigningSlasherWrapper](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)‹››*

___

###  getDowntimeSlasher

▸ **getDowntimeSlasher**(): *Promise‹[DowntimeSlasherWrapper](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:116](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L116)*

**Returns:** *Promise‹[DowntimeSlasherWrapper](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)‹››*

___

###  getElection

▸ **getElection**(): *Promise‹[ElectionWrapper](_wrappers_election_.electionwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:119](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L119)*

**Returns:** *Promise‹[ElectionWrapper](_wrappers_election_.electionwrapper.md)‹››*

___

###  getErc20

▸ **getErc20**(`address`: string): *Promise‹[Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md)‹Ierc20‹›››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:125](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L125)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹[Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md)‹Ierc20‹›››*

___

###  getEscrow

▸ **getEscrow**(): *Promise‹[EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L128)*

**Returns:** *Promise‹[EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)‹››*

___

###  getExchange

▸ **getExchange**(`stableToken`: [StableToken](../enums/_base_.celocontract.md#stabletoken)): *Promise‹[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:131](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L131)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`stableToken` | [StableToken](../enums/_base_.celocontract.md#stabletoken) | StableToken.cUSD |

**Returns:** *Promise‹[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)‹››*

___

###  getFreezer

▸ **getFreezer**(): *Promise‹[FreezerWrapper](_wrappers_freezer_.freezerwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L134)*

**Returns:** *Promise‹[FreezerWrapper](_wrappers_freezer_.freezerwrapper.md)‹››*

___

###  getGasPriceMinimum

▸ **getGasPriceMinimum**(): *Promise‹[GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:140](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L140)*

**Returns:** *Promise‹[GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)‹››*

___

###  getGoldToken

▸ **getGoldToken**(): *Promise‹[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:143](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L143)*

**Returns:** *Promise‹[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)‹››*

___

###  getGovernance

▸ **getGovernance**(): *Promise‹[GovernanceWrapper](_wrappers_governance_.governancewrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:146](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L146)*

**Returns:** *Promise‹[GovernanceWrapper](_wrappers_governance_.governancewrapper.md)‹››*

___

###  getGrandaMento

▸ **getGrandaMento**(): *Promise‹[GrandaMentoWrapper](_wrappers_grandamento_.grandamentowrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:149](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L149)*

**Returns:** *Promise‹[GrandaMentoWrapper](_wrappers_grandamento_.grandamentowrapper.md)‹››*

___

###  getLockedGold

▸ **getLockedGold**(): *Promise‹[LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L152)*

**Returns:** *Promise‹[LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)‹››*

___

###  getMetaTransactionWallet

▸ **getMetaTransactionWallet**(`address`: string): *Promise‹[MetaTransactionWalletWrapper](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:155](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L155)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹[MetaTransactionWalletWrapper](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)‹››*

___

###  getMetaTransactionWalletDeployer

▸ **getMetaTransactionWalletDeployer**(`address`: string): *Promise‹[MetaTransactionWalletDeployerWrapper](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:158](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L158)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹[MetaTransactionWalletDeployerWrapper](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md)‹››*

___

###  getMultiSig

▸ **getMultiSig**(`address`: string): *Promise‹[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:161](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L161)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)‹››*

___

###  getReserve

▸ **getReserve**(): *Promise‹[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:167](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L167)*

**Returns:** *Promise‹[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)‹››*

___

###  getSortedOracles

▸ **getSortedOracles**(): *Promise‹[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:170](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L170)*

**Returns:** *Promise‹[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)‹››*

___

###  getStableToken

▸ **getStableToken**(`stableToken`: [StableToken](../enums/_base_.celocontract.md#stabletoken)): *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:173](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L173)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`stableToken` | [StableToken](../enums/_base_.celocontract.md#stabletoken) | StableToken.cUSD |

**Returns:** *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)‹››*

___

###  getValidators

▸ **getValidators**(): *Promise‹[ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:176](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L176)*

**Returns:** *Promise‹[ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)‹››*

___

###  invalidateContract

▸ **invalidateContract**<**C**>(`contract`: C): *void*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:192](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L192)*

**Type parameters:**

▪ **C**: *[ValidWrappers](../modules/_contract_cache_.md#validwrappers)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | C |

**Returns:** *void*
