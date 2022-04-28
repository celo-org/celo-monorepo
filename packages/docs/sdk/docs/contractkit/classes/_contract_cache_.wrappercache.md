[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["contract-cache"](../modules/_contract_cache_.md) › [WrapperCache](_contract_cache_.wrappercache.md)

# Class: WrapperCache

Kit ContractWrappers factory & cache.

Provides access to all contract wrappers for celo core contracts

**`remarks`** 

Because it provides access to all contract wrappers it must load all wrappers and the contract ABIs for them
Consider Using {@link MiniWrapperCache}, building your own, or if you only need one Wrapper using it directly

## Hierarchy

* **WrapperCache**

## Implements

* [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)

## Index

### Constructors

* [constructor](_contract_cache_.wrappercache.md#constructor)

### Properties

* [_web3Contracts](_contract_cache_.wrappercache.md#readonly-_web3contracts)
* [connection](_contract_cache_.wrappercache.md#readonly-connection)
* [registry](_contract_cache_.wrappercache.md#readonly-registry)

### Methods

* [getAccounts](_contract_cache_.wrappercache.md#getaccounts)
* [getAttestations](_contract_cache_.wrappercache.md#getattestations)
* [getBlockchainParameters](_contract_cache_.wrappercache.md#getblockchainparameters)
* [getContract](_contract_cache_.wrappercache.md#getcontract)
* [getDoubleSigningSlasher](_contract_cache_.wrappercache.md#getdoublesigningslasher)
* [getDowntimeSlasher](_contract_cache_.wrappercache.md#getdowntimeslasher)
* [getElection](_contract_cache_.wrappercache.md#getelection)
* [getEpochRewards](_contract_cache_.wrappercache.md#getepochrewards)
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

\+ **new WrapperCache**(`connection`: Connection, `_web3Contracts`: [Web3ContractCache](_web3_contract_cache_.web3contractcache.md), `registry`: [AddressRegistry](_address_registry_.addressregistry.md)): *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:126](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L126)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`_web3Contracts` | [Web3ContractCache](_web3_contract_cache_.web3contractcache.md) |
`registry` | [AddressRegistry](_address_registry_.addressregistry.md) |

**Returns:** *[WrapperCache](_contract_cache_.wrappercache.md)*

## Properties

### `Readonly` _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:129](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L129)*

___

### `Readonly` connection

• **connection**: *Connection*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L128)*

___

### `Readonly` registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:130](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L130)*

## Methods

###  getAccounts

▸ **getAccounts**(): *Promise‹[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)‹››*

*Implementation of [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:133](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L133)*

**Returns:** *Promise‹[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)‹››*

___

###  getAttestations

▸ **getAttestations**(): *Promise‹[AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:136](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L136)*

**Returns:** *Promise‹[AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)‹››*

___

###  getBlockchainParameters

▸ **getBlockchainParameters**(): *Promise‹[BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:139](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L139)*

**Returns:** *Promise‹[BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)‹››*

___

###  getContract

▸ **getContract**<**C**>(`contract`: C, `address?`: undefined | string): *Promise‹NonNullable‹WrapperCacheMap[C]››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:210](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L210)*

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

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:142](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L142)*

**Returns:** *Promise‹[DoubleSigningSlasherWrapper](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)‹››*

___

###  getDowntimeSlasher

▸ **getDowntimeSlasher**(): *Promise‹[DowntimeSlasherWrapper](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:145](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L145)*

**Returns:** *Promise‹[DowntimeSlasherWrapper](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)‹››*

___

###  getElection

▸ **getElection**(): *Promise‹[ElectionWrapper](_wrappers_election_.electionwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:148](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L148)*

**Returns:** *Promise‹[ElectionWrapper](_wrappers_election_.electionwrapper.md)‹››*

___

###  getEpochRewards

▸ **getEpochRewards**(): *Promise‹[EpochRewardsWrapper](_wrappers_epochrewards_.epochrewardswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:151](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L151)*

**Returns:** *Promise‹[EpochRewardsWrapper](_wrappers_epochrewards_.epochrewardswrapper.md)‹››*

___

###  getErc20

▸ **getErc20**(`address`: string): *Promise‹[Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md)‹Ierc20‹›››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:154](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L154)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹[Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md)‹Ierc20‹›››*

___

###  getEscrow

▸ **getEscrow**(): *Promise‹[EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)›*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:157](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L157)*

**Returns:** *Promise‹[EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)›*

___

###  getExchange

▸ **getExchange**(`stableToken`: [StableToken](../enums/_base_.celocontract.md#stabletoken)): *Promise‹[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)‹››*

*Implementation of [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:161](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L161)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`stableToken` | [StableToken](../enums/_base_.celocontract.md#stabletoken) | StableToken.cUSD |

**Returns:** *Promise‹[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)‹››*

___

###  getFreezer

▸ **getFreezer**(): *Promise‹[FreezerWrapper](_wrappers_freezer_.freezerwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:165](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L165)*

**Returns:** *Promise‹[FreezerWrapper](_wrappers_freezer_.freezerwrapper.md)‹››*

___

###  getGasPriceMinimum

▸ **getGasPriceMinimum**(): *Promise‹[GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:169](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L169)*

**Returns:** *Promise‹[GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)‹››*

___

###  getGoldToken

▸ **getGoldToken**(): *Promise‹[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)‹››*

*Implementation of [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:172](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L172)*

**Returns:** *Promise‹[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)‹››*

___

###  getGovernance

▸ **getGovernance**(): *Promise‹[GovernanceWrapper](_wrappers_governance_.governancewrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:175](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L175)*

**Returns:** *Promise‹[GovernanceWrapper](_wrappers_governance_.governancewrapper.md)‹››*

___

###  getGrandaMento

▸ **getGrandaMento**(): *Promise‹[GrandaMentoWrapper](_wrappers_grandamento_.grandamentowrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:178](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L178)*

**Returns:** *Promise‹[GrandaMentoWrapper](_wrappers_grandamento_.grandamentowrapper.md)‹››*

___

###  getLockedGold

▸ **getLockedGold**(): *Promise‹[LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:181](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L181)*

**Returns:** *Promise‹[LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)‹››*

___

###  getMetaTransactionWallet

▸ **getMetaTransactionWallet**(`address`: string): *Promise‹[MetaTransactionWalletWrapper](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:184](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L184)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹[MetaTransactionWalletWrapper](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)‹››*

___

###  getMetaTransactionWalletDeployer

▸ **getMetaTransactionWalletDeployer**(`address`: string): *Promise‹[MetaTransactionWalletDeployerWrapper](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:187](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L187)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹[MetaTransactionWalletDeployerWrapper](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md)‹››*

___

###  getMultiSig

▸ **getMultiSig**(`address`: string): *Promise‹[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:190](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L190)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)‹››*

___

###  getReserve

▸ **getReserve**(): *Promise‹[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:193](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L193)*

**Returns:** *Promise‹[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)‹››*

___

###  getSortedOracles

▸ **getSortedOracles**(): *Promise‹[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:196](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L196)*

**Returns:** *Promise‹[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)‹››*

___

###  getStableToken

▸ **getStableToken**(`stableToken`: [StableToken](../enums/_base_.celocontract.md#stabletoken)): *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)‹››*

*Implementation of [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:200](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L200)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`stableToken` | [StableToken](../enums/_base_.celocontract.md#stabletoken) | StableToken.cUSD |

**Returns:** *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)‹››*

___

###  getValidators

▸ **getValidators**(): *Promise‹[ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:203](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L203)*

**Returns:** *Promise‹[ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)‹››*

___

###  invalidateContract

▸ **invalidateContract**<**C**>(`contract`: C): *void*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:234](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L234)*

**Type parameters:**

▪ **C**: *[ValidWrappers](../modules/_contract_cache_.md#validwrappers)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | C |

**Returns:** *void*
