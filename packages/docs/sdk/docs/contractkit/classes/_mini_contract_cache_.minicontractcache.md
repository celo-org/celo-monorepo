[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["mini-contract-cache"](../modules/_mini_contract_cache_.md) › [MiniContractCache](_mini_contract_cache_.minicontractcache.md)

# Class: MiniContractCache

Alternative Contract Cache with Minimal Contracts

Provides access to a subset of wrappers: [AccountsWrapper](_wrappers_accounts_.accountswrapper.md),  [ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md), [GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md) and Celo Token contracts
Used internally by [MiniContractKit](_mini_kit_.minicontractkit.md)

**`param`** – {@link Connection}

**`param`** – [AddressRegistry](_address_registry_.addressregistry.md)

## Hierarchy

* **MiniContractCache**

## Implements

* [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)

## Index

### Constructors

* [constructor](_mini_contract_cache_.minicontractcache.md#constructor)

### Properties

* [connection](_mini_contract_cache_.minicontractcache.md#readonly-connection)
* [registry](_mini_contract_cache_.minicontractcache.md#readonly-registry)

### Methods

* [getAccounts](_mini_contract_cache_.minicontractcache.md#getaccounts)
* [getContract](_mini_contract_cache_.minicontractcache.md#getcontract)
* [getExchange](_mini_contract_cache_.minicontractcache.md#getexchange)
* [getGoldToken](_mini_contract_cache_.minicontractcache.md#getgoldtoken)
* [getStableToken](_mini_contract_cache_.minicontractcache.md#getstabletoken)
* [invalidateContract](_mini_contract_cache_.minicontractcache.md#invalidatecontract)

## Constructors

###  constructor

\+ **new MiniContractCache**(`connection`: Connection, `registry`: [AddressRegistry](_address_registry_.addressregistry.md), `contractClasses`: [ContractsBroughtBase](../modules/_mini_contract_cache_.md#contractsbroughtbase)): *[MiniContractCache](_mini_contract_cache_.minicontractcache.md)*

*Defined in [packages/sdk/contractkit/src/mini-contract-cache.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-contract-cache.ts#L88)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`connection` | Connection | - |
`registry` | [AddressRegistry](_address_registry_.addressregistry.md) | - |
`contractClasses` | [ContractsBroughtBase](../modules/_mini_contract_cache_.md#contractsbroughtbase) | MINIMUM_CONTRACTS |

**Returns:** *[MiniContractCache](_mini_contract_cache_.minicontractcache.md)*

## Properties

### `Readonly` connection

• **connection**: *Connection*

*Defined in [packages/sdk/contractkit/src/mini-contract-cache.ts:91](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-contract-cache.ts#L91)*

___

### `Readonly` registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/sdk/contractkit/src/mini-contract-cache.ts:92](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-contract-cache.ts#L92)*

## Methods

###  getAccounts

▸ **getAccounts**(): *Promise‹[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)›*

*Implementation of [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)*

*Defined in [packages/sdk/contractkit/src/mini-contract-cache.ts:96](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-contract-cache.ts#L96)*

**Returns:** *Promise‹[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)›*

___

###  getContract

▸ **getContract**<**ContractKey**>(`contract`: ContractKey, `address?`: undefined | string): *Promise‹Wrappers‹ContractKey››*

*Defined in [packages/sdk/contractkit/src/mini-contract-cache.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-contract-cache.ts#L114)*

Get Contract wrapper

**Type parameters:**

▪ **ContractKey**: *keyof ContractsBroughtBase*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | ContractKey |
`address?` | undefined &#124; string |

**Returns:** *Promise‹Wrappers‹ContractKey››*

___

###  getExchange

▸ **getExchange**(`stableToken`: [StableToken](../enums/_base_.celocontract.md#stabletoken)): *Promise‹[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)›*

*Implementation of [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)*

*Defined in [packages/sdk/contractkit/src/mini-contract-cache.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-contract-cache.ts#L99)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`stableToken` | [StableToken](../enums/_base_.celocontract.md#stabletoken) | StableToken.cUSD |

**Returns:** *Promise‹[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)›*

___

###  getGoldToken

▸ **getGoldToken**(): *Promise‹[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)›*

*Implementation of [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)*

*Defined in [packages/sdk/contractkit/src/mini-contract-cache.ts:103](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-contract-cache.ts#L103)*

**Returns:** *Promise‹[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)›*

___

###  getStableToken

▸ **getStableToken**(`stableToken`: [StableToken](../enums/_base_.celocontract.md#stabletoken)): *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)›*

*Implementation of [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)*

*Defined in [packages/sdk/contractkit/src/mini-contract-cache.ts:107](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-contract-cache.ts#L107)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`stableToken` | [StableToken](../enums/_base_.celocontract.md#stabletoken) | StableToken.cUSD |

**Returns:** *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)›*

___

###  invalidateContract

▸ **invalidateContract**<**C**>(`contract`: C): *void*

*Defined in [packages/sdk/contractkit/src/mini-contract-cache.ts:154](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-contract-cache.ts#L154)*

**Type parameters:**

▪ **C**: *keyof ContractsBroughtBase*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | C |

**Returns:** *void*
