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
* [getFederatedAttestations](_contract_cache_.wrappercache.md#getfederatedattestations)
* [getFreezer](_contract_cache_.wrappercache.md#getfreezer)
* [getGasPriceMinimum](_contract_cache_.wrappercache.md#getgaspriceminimum)
* [getGoldToken](_contract_cache_.wrappercache.md#getgoldtoken)
* [getGovernance](_contract_cache_.wrappercache.md#getgovernance)
* [getGrandaMento](_contract_cache_.wrappercache.md#getgrandamento)
* [getLockedGold](_contract_cache_.wrappercache.md#getlockedgold)
* [getMetaTransactionWallet](_contract_cache_.wrappercache.md#getmetatransactionwallet)
* [getMetaTransactionWalletDeployer](_contract_cache_.wrappercache.md#getmetatransactionwalletdeployer)
* [getMultiSig](_contract_cache_.wrappercache.md#getmultisig)
* [getOdisPayments](_contract_cache_.wrappercache.md#getodispayments)
* [getReserve](_contract_cache_.wrappercache.md#getreserve)
* [getSortedOracles](_contract_cache_.wrappercache.md#getsortedoracles)
* [getStableToken](_contract_cache_.wrappercache.md#getstabletoken)
* [getStableTokenRegistry](_contract_cache_.wrappercache.md#getstabletokenregistry)
* [getValidators](_contract_cache_.wrappercache.md#getvalidators)
* [invalidateContract](_contract_cache_.wrappercache.md#invalidatecontract)

## Constructors

###  constructor

\+ **new WrapperCache**(`connection`: Connection, `_web3Contracts`: [Web3ContractCache](_web3_contract_cache_.web3contractcache.md), `registry`: [AddressRegistry](_address_registry_.addressregistry.md)): *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:135](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L135)*

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

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:138](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L138)*

___

### `Readonly` connection

• **connection**: *Connection*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:137](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L137)*

___

### `Readonly` registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:139](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L139)*

## Methods

###  getAccounts

▸ **getAccounts**(): *Promise‹[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)‹››*

*Implementation of [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:142](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L142)*

**Returns:** *Promise‹[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)‹››*

___

###  getAttestations

▸ **getAttestations**(): *Promise‹[AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:145](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L145)*

**Returns:** *Promise‹[AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)‹››*

___

###  getBlockchainParameters

▸ **getBlockchainParameters**(): *Promise‹[BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:148](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L148)*

**Returns:** *Promise‹[BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)‹››*

___

###  getContract

▸ **getContract**<**C**>(`contract`: C, `address?`: undefined | string): *Promise‹NonNullable‹WrapperCacheMap[C]››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:230](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L230)*

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

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:151](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L151)*

**Returns:** *Promise‹[DoubleSigningSlasherWrapper](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)‹››*

___

###  getDowntimeSlasher

▸ **getDowntimeSlasher**(): *Promise‹[DowntimeSlasherWrapper](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:154](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L154)*

**Returns:** *Promise‹[DowntimeSlasherWrapper](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)‹››*

___

###  getElection

▸ **getElection**(): *Promise‹[ElectionWrapper](_wrappers_election_.electionwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:157](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L157)*

**Returns:** *Promise‹[ElectionWrapper](_wrappers_election_.electionwrapper.md)‹››*

___

###  getEpochRewards

▸ **getEpochRewards**(): *Promise‹[EpochRewardsWrapper](_wrappers_epochrewards_.epochrewardswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:160](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L160)*

**Returns:** *Promise‹[EpochRewardsWrapper](_wrappers_epochrewards_.epochrewardswrapper.md)‹››*

___

###  getErc20

▸ **getErc20**(`address`: string): *Promise‹[Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md)‹Ierc20‹›››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:163](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L163)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹[Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md)‹Ierc20‹›››*

___

###  getEscrow

▸ **getEscrow**(): *Promise‹[EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)›*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:166](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L166)*

**Returns:** *Promise‹[EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)›*

___

###  getExchange

▸ **getExchange**(`stableToken`: [StableToken](../enums/_base_.celocontract.md#stabletoken)): *Promise‹[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)‹››*

*Implementation of [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:170](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L170)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`stableToken` | [StableToken](../enums/_base_.celocontract.md#stabletoken) | StableToken.cUSD |

**Returns:** *Promise‹[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)‹››*

___

###  getFederatedAttestations

▸ **getFederatedAttestations**(): *Promise‹[FederatedAttestationsWrapper](_wrappers_federatedattestations_.federatedattestationswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:178](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L178)*

**Returns:** *Promise‹[FederatedAttestationsWrapper](_wrappers_federatedattestations_.federatedattestationswrapper.md)‹››*

___

###  getFreezer

▸ **getFreezer**(): *Promise‹[FreezerWrapper](_wrappers_freezer_.freezerwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:174](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L174)*

**Returns:** *Promise‹[FreezerWrapper](_wrappers_freezer_.freezerwrapper.md)‹››*

___

###  getGasPriceMinimum

▸ **getGasPriceMinimum**(): *Promise‹[GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:182](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L182)*

**Returns:** *Promise‹[GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)‹››*

___

###  getGoldToken

▸ **getGoldToken**(): *Promise‹[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)‹››*

*Implementation of [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:185](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L185)*

**Returns:** *Promise‹[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)‹››*

___

###  getGovernance

▸ **getGovernance**(): *Promise‹[GovernanceWrapper](_wrappers_governance_.governancewrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:188](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L188)*

**Returns:** *Promise‹[GovernanceWrapper](_wrappers_governance_.governancewrapper.md)‹››*

___

###  getGrandaMento

▸ **getGrandaMento**(): *Promise‹[GrandaMentoWrapper](_wrappers_grandamento_.grandamentowrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:191](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L191)*

**Returns:** *Promise‹[GrandaMentoWrapper](_wrappers_grandamento_.grandamentowrapper.md)‹››*

___

###  getLockedGold

▸ **getLockedGold**(): *Promise‹[LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:194](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L194)*

**Returns:** *Promise‹[LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)‹››*

___

###  getMetaTransactionWallet

▸ **getMetaTransactionWallet**(`address`: string): *Promise‹[MetaTransactionWalletWrapper](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:197](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L197)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹[MetaTransactionWalletWrapper](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)‹››*

___

###  getMetaTransactionWalletDeployer

▸ **getMetaTransactionWalletDeployer**(`address`: string): *Promise‹[MetaTransactionWalletDeployerWrapper](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:200](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L200)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹[MetaTransactionWalletDeployerWrapper](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md)‹››*

___

###  getMultiSig

▸ **getMultiSig**(`address`: string): *Promise‹[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:203](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L203)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)‹››*

___

###  getOdisPayments

▸ **getOdisPayments**(): *Promise‹[OdisPaymentsWrapper](_wrappers_odispayments_.odispaymentswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:206](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L206)*

**Returns:** *Promise‹[OdisPaymentsWrapper](_wrappers_odispayments_.odispaymentswrapper.md)‹››*

___

###  getReserve

▸ **getReserve**(): *Promise‹[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:210](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L210)*

**Returns:** *Promise‹[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)‹››*

___

###  getSortedOracles

▸ **getSortedOracles**(): *Promise‹[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:213](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L213)*

**Returns:** *Promise‹[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)‹››*

___

###  getStableToken

▸ **getStableToken**(`stableToken`: [StableToken](../enums/_base_.celocontract.md#stabletoken)): *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)‹››*

*Implementation of [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:217](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L217)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`stableToken` | [StableToken](../enums/_base_.celocontract.md#stabletoken) | StableToken.cUSD |

**Returns:** *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)‹››*

___

###  getStableTokenRegistry

▸ **getStableTokenRegistry**(): *Promise‹[StableTokenRegistryWrapper](_wrappers_stabletokenregistry_.stabletokenregistrywrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:223](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L223)*

**Returns:** *Promise‹[StableTokenRegistryWrapper](_wrappers_stabletokenregistry_.stabletokenregistrywrapper.md)‹››*

___

###  getValidators

▸ **getValidators**(): *Promise‹[ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:220](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L220)*

**Returns:** *Promise‹[ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)‹››*

___

###  invalidateContract

▸ **invalidateContract**<**C**>(`contract`: C): *void*

*Defined in [packages/sdk/contractkit/src/contract-cache.ts:254](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L254)*

**Type parameters:**

▪ **C**: *[ValidWrappers](../modules/_contract_cache_.md#validwrappers)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | C |

**Returns:** *void*
