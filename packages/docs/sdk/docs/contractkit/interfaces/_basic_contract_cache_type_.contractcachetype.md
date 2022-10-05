[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["basic-contract-cache-type"](../modules/_basic_contract_cache_type_.md) › [ContractCacheType](_basic_contract_cache_type_.contractcachetype.md)

# Interface: ContractCacheType

Interface for a class with the minimum required wrappers
to make a [MiniContractKit](../classes/_mini_kit_.minicontractkit.md) or [CeloTokens](../classes/_celo_tokens_.celotokens.md) Class

## Hierarchy

* **ContractCacheType**

## Implemented by

* [MiniContractCache](../classes/_mini_contract_cache_.minicontractcache.md)
* [WrapperCache](../classes/_contract_cache_.wrappercache.md)

## Index

### Methods

* [getAccounts](_basic_contract_cache_type_.contractcachetype.md#getaccounts)
* [getContract](_basic_contract_cache_type_.contractcachetype.md#getcontract)
* [getExchange](_basic_contract_cache_type_.contractcachetype.md#getexchange)
* [getGoldToken](_basic_contract_cache_type_.contractcachetype.md#getgoldtoken)
* [getStableToken](_basic_contract_cache_type_.contractcachetype.md#getstabletoken)

## Methods

###  getAccounts

▸ **getAccounts**(): *Promise‹[AccountsWrapper](../classes/_wrappers_accounts_.accountswrapper.md)›*

*Defined in [packages/sdk/contractkit/src/basic-contract-cache-type.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/basic-contract-cache-type.ts#L13)*

**Returns:** *Promise‹[AccountsWrapper](../classes/_wrappers_accounts_.accountswrapper.md)›*

___

###  getContract

▸ **getContract**(`contract`: [Exchange](../enums/_base_.celocontract.md#exchange) | [ExchangeEUR](../enums/_base_.celocontract.md#exchangeeur) | [ExchangeBRL](../enums/_base_.celocontract.md#exchangebrl)): *Promise‹[ExchangeWrapper](../classes/_wrappers_exchange_.exchangewrapper.md)›*

*Defined in [packages/sdk/contractkit/src/basic-contract-cache-type.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/basic-contract-cache-type.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [Exchange](../enums/_base_.celocontract.md#exchange) &#124; [ExchangeEUR](../enums/_base_.celocontract.md#exchangeeur) &#124; [ExchangeBRL](../enums/_base_.celocontract.md#exchangebrl) |

**Returns:** *Promise‹[ExchangeWrapper](../classes/_wrappers_exchange_.exchangewrapper.md)›*

▸ **getContract**(`contract`: [CeloTokenContract](../modules/_base_.md#celotokencontract)): *Promise‹[StableTokenWrapper](../classes/_wrappers_stabletokenwrapper_.stabletokenwrapper.md)›*

*Defined in [packages/sdk/contractkit/src/basic-contract-cache-type.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/basic-contract-cache-type.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [CeloTokenContract](../modules/_base_.md#celotokencontract) |

**Returns:** *Promise‹[StableTokenWrapper](../classes/_wrappers_stabletokenwrapper_.stabletokenwrapper.md)›*

▸ **getContract**(`contract`: [GoldToken](../enums/_base_.celocontract.md#goldtoken)): *Promise‹[GoldTokenWrapperType](../modules/_wrappers_goldtokenwrapper_.md#goldtokenwrappertype)›*

*Defined in [packages/sdk/contractkit/src/basic-contract-cache-type.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/basic-contract-cache-type.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [GoldToken](../enums/_base_.celocontract.md#goldtoken) |

**Returns:** *Promise‹[GoldTokenWrapperType](../modules/_wrappers_goldtokenwrapper_.md#goldtokenwrappertype)›*

___

###  getExchange

▸ **getExchange**(`stableToken`: [StableToken](../enums/_base_.celocontract.md#stabletoken)): *Promise‹[ExchangeWrapper](../classes/_wrappers_exchange_.exchangewrapper.md)›*

*Defined in [packages/sdk/contractkit/src/basic-contract-cache-type.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/basic-contract-cache-type.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`stableToken` | [StableToken](../enums/_base_.celocontract.md#stabletoken) |

**Returns:** *Promise‹[ExchangeWrapper](../classes/_wrappers_exchange_.exchangewrapper.md)›*

___

###  getGoldToken

▸ **getGoldToken**(): *Promise‹[GoldTokenWrapper](../classes/_wrappers_goldtokenwrapper_.goldtokenwrapper.md)›*

*Defined in [packages/sdk/contractkit/src/basic-contract-cache-type.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/basic-contract-cache-type.ts#L16)*

**Returns:** *Promise‹[GoldTokenWrapper](../classes/_wrappers_goldtokenwrapper_.goldtokenwrapper.md)›*

___

###  getStableToken

▸ **getStableToken**(`stableToken`: [StableToken](../enums/_base_.celocontract.md#stabletoken)): *Promise‹[StableTokenWrapper](../classes/_wrappers_stabletokenwrapper_.stabletokenwrapper.md)›*

*Defined in [packages/sdk/contractkit/src/basic-contract-cache-type.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/basic-contract-cache-type.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`stableToken` | [StableToken](../enums/_base_.celocontract.md#stabletoken) |

**Returns:** *Promise‹[StableTokenWrapper](../classes/_wrappers_stabletokenwrapper_.stabletokenwrapper.md)›*
