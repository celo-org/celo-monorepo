# Class: WrapperCache

Kit ContractWrappers factory & cache.

Provides access to all contract wrappers for celo core contracts

## Hierarchy

* **WrapperCache**

## Index

### Constructors

* [constructor](_contract_cache_.wrappercache.md#constructor)

### Properties

* [kit](_contract_cache_.wrappercache.md#kit)

### Methods

* [getAccounts](_contract_cache_.wrappercache.md#getaccounts)
* [getAttestations](_contract_cache_.wrappercache.md#getattestations)
* [getBlockchainParameters](_contract_cache_.wrappercache.md#getblockchainparameters)
* [getContract](_contract_cache_.wrappercache.md#getcontract)
* [getElection](_contract_cache_.wrappercache.md#getelection)
* [getEscrow](_contract_cache_.wrappercache.md#getescrow)
* [getExchange](_contract_cache_.wrappercache.md#getexchange)
* [getGasPriceMinimum](_contract_cache_.wrappercache.md#getgaspriceminimum)
* [getGoldToken](_contract_cache_.wrappercache.md#getgoldtoken)
* [getGovernance](_contract_cache_.wrappercache.md#getgovernance)
* [getLockedGold](_contract_cache_.wrappercache.md#getlockedgold)
* [getReserve](_contract_cache_.wrappercache.md#getreserve)
* [getSortedOracles](_contract_cache_.wrappercache.md#getsortedoracles)
* [getStableToken](_contract_cache_.wrappercache.md#getstabletoken)
* [getValidators](_contract_cache_.wrappercache.md#getvalidators)

## Constructors

###  constructor

\+ **new WrapperCache**(`kit`: [ContractKit](_kit_.contractkit.md)): *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [packages/contractkit/src/contract-cache.ts:73](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *[WrapperCache](_contract_cache_.wrappercache.md)*

## Properties

###  kit

• **kit**: *[ContractKit](_kit_.contractkit.md)*

*Defined in [packages/contractkit/src/contract-cache.ts:75](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L75)*

## Methods

###  getAccounts

▸ **getAccounts**(): *Promise‹[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:77](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L77)*

**Returns:** *Promise‹[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)‹››*

___

###  getAttestations

▸ **getAttestations**(): *Promise‹[AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:80](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L80)*

**Returns:** *Promise‹[AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)‹››*

___

###  getBlockchainParameters

▸ **getBlockchainParameters**(): *Promise‹[BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:83](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L83)*

**Returns:** *Promise‹[BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)‹››*

___

###  getContract

▸ **getContract**<**C**>(`contract`: C): *Promise‹WrapperCacheMap[C] extends undefined | null ? never : WrapperCacheMap[C]›*

*Defined in [packages/contractkit/src/contract-cache.ts:135](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L135)*

Get Contract wrapper

**Type parameters:**

▪ **C**: *[ValidWrappers](../modules/_contract_cache_.md#validwrappers)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | C |

**Returns:** *Promise‹WrapperCacheMap[C] extends undefined | null ? never : WrapperCacheMap[C]›*

___

###  getElection

▸ **getElection**(): *Promise‹[ElectionWrapper](_wrappers_election_.electionwrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:86](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L86)*

**Returns:** *Promise‹[ElectionWrapper](_wrappers_election_.electionwrapper.md)‹››*

___

###  getEscrow

▸ **getEscrow**(): *Promise‹[EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:92](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L92)*

**Returns:** *Promise‹[EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)‹››*

___

###  getExchange

▸ **getExchange**(): *Promise‹[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:95](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L95)*

**Returns:** *Promise‹[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)‹››*

___

###  getGasPriceMinimum

▸ **getGasPriceMinimum**(): *Promise‹[GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:101](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L101)*

**Returns:** *Promise‹[GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)‹››*

___

###  getGoldToken

▸ **getGoldToken**(): *Promise‹[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:104](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L104)*

**Returns:** *Promise‹[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)‹››*

___

###  getGovernance

▸ **getGovernance**(): *Promise‹[GovernanceWrapper](_wrappers_governance_.governancewrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:107](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L107)*

**Returns:** *Promise‹[GovernanceWrapper](_wrappers_governance_.governancewrapper.md)‹››*

___

###  getLockedGold

▸ **getLockedGold**(): *Promise‹[LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:110](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L110)*

**Returns:** *Promise‹[LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)‹››*

___

###  getReserve

▸ **getReserve**(): *Promise‹[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:119](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L119)*

**Returns:** *Promise‹[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)‹››*

___

###  getSortedOracles

▸ **getSortedOracles**(): *Promise‹[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:122](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L122)*

**Returns:** *Promise‹[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)‹››*

___

###  getStableToken

▸ **getStableToken**(): *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:125](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L125)*

**Returns:** *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)‹››*

___

###  getValidators

▸ **getValidators**(): *Promise‹[ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)‹››*

*Defined in [packages/contractkit/src/contract-cache.ts:128](https://github.com/celo-org/celo-monorepo/blob/06adf8b7a/packages/contractkit/src/contract-cache.ts#L128)*

**Returns:** *Promise‹[ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)‹››*
