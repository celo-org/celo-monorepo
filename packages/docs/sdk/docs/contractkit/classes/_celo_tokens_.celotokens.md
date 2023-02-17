[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["celo-tokens"](../modules/_celo_tokens_.md) › [CeloTokens](_celo_tokens_.celotokens.md)

# Class: CeloTokens

A helper class to interact with all Celo tokens, ie CELO and stable tokens

## Hierarchy

* **CeloTokens**

## Index

### Constructors

* [constructor](_celo_tokens_.celotokens.md#constructor)

### Properties

* [contracts](_celo_tokens_.celotokens.md#readonly-contracts)
* [isStableTokenContract](_celo_tokens_.celotokens.md#isstabletokencontract)
* [registry](_celo_tokens_.celotokens.md#readonly-registry)

### Methods

* [balancesOf](_celo_tokens_.celotokens.md#balancesof)
* [forEachCeloToken](_celo_tokens_.celotokens.md#foreachcelotoken)
* [forStableCeloToken](_celo_tokens_.celotokens.md#forstablecelotoken)
* [getAddress](_celo_tokens_.celotokens.md#getaddress)
* [getAddresses](_celo_tokens_.celotokens.md#getaddresses)
* [getContract](_celo_tokens_.celotokens.md#getcontract)
* [getExchangeContract](_celo_tokens_.celotokens.md#getexchangecontract)
* [getExchangesConfigs](_celo_tokens_.celotokens.md#getexchangesconfigs)
* [getFeeCurrencyAddress](_celo_tokens_.celotokens.md#getfeecurrencyaddress)
* [getStablesConfigs](_celo_tokens_.celotokens.md#getstablesconfigs)
* [getWrapper](_celo_tokens_.celotokens.md#getwrapper)
* [getWrappers](_celo_tokens_.celotokens.md#getwrappers)
* [isStableToken](_celo_tokens_.celotokens.md#isstabletoken)
* [validCeloTokenInfos](_celo_tokens_.celotokens.md#validcelotokeninfos)
* [validStableTokenInfos](_celo_tokens_.celotokens.md#validstabletokeninfos)

## Constructors

###  constructor

\+ **new CeloTokens**(`contracts`: [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md), `registry`: [AddressRegistry](_address_registry_.addressregistry.md)): *[CeloTokens](_celo_tokens_.celotokens.md)*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`contracts` | [ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md) |
`registry` | [AddressRegistry](_address_registry_.addressregistry.md) |

**Returns:** *[CeloTokens](_celo_tokens_.celotokens.md)*

## Properties

### `Readonly` contracts

• **contracts**: *[ContractCacheType](../interfaces/_basic_contract_cache_type_.contractcachetype.md)*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L62)*

___

###  isStableTokenContract

• **isStableTokenContract**: *[isStableTokenContract](../modules/_celo_tokens_.md#isstabletokencontract)* = isStableTokenContract

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:272](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L272)*

___

### `Readonly` registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L62)*

## Methods

###  balancesOf

▸ **balancesOf**(`address`: string): *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹BigNumber››*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L70)*

Gets an address's balance for each celo token.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | the address to look up the balances for |

**Returns:** *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹BigNumber››*

a promise resolving to an object containing the address's balance
 for each celo token

___

###  forEachCeloToken

▸ **forEachCeloToken**<**T**>(`fn`: function): *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹T››*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L120)*

Runs fn for each celo token found in celoTokenInfos, and returns the
value of each call in an object keyed by the token.

**Type parameters:**

▪ **T**

**Parameters:**

▪ **fn**: *function*

the function to be called for each CeloTokenInfo.

▸ (`info`: [CeloTokenInfo](../interfaces/_celo_tokens_.celotokeninfo.md)): *T | Promise‹T›*

**Parameters:**

Name | Type |
------ | ------ |
`info` | [CeloTokenInfo](../interfaces/_celo_tokens_.celotokeninfo.md) |

**Returns:** *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹T››*

an object containing the resolved value the call to fn for each
 celo token.

___

###  forStableCeloToken

▸ **forStableCeloToken**<**T**>(`fn`: function): *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹T››*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:143](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L143)*

Runs fn for each stable token found in stableTokenInfos, and returns the
value of each call in an object keyed by the token.

**Type parameters:**

▪ **T**

**Parameters:**

▪ **fn**: *function*

the function to be called for each StableTokenInfo.

▸ (`info`: [StableTokenInfo](../interfaces/_celo_tokens_.stabletokeninfo.md)): *T | Promise‹T›*

**Parameters:**

Name | Type |
------ | ------ |
`info` | [StableTokenInfo](../interfaces/_celo_tokens_.stabletokeninfo.md) |

**Returns:** *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹T››*

an object containing the resolved value the call to fn for each
 celo token.

___

###  getAddress

▸ **getAddress**(`token`: [CeloTokenType](../modules/_celo_tokens_.md#celotokentype)): *Promise‹string›*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:247](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L247)*

Gets the address of the contract for the provided token.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloTokenType](../modules/_celo_tokens_.md#celotokentype) | the token to get the (proxy) contract address for |

**Returns:** *Promise‹string›*

A promise resolving to the address of the token's contract

___

###  getAddresses

▸ **getAddresses**(): *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹string››*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L89)*

Gets the address for each celo token proxy contract.

**Returns:** *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹string››*

an promise resolving to an object containing the address for each celo token proxy.

___

###  getContract

▸ **getContract**(`token`: [StableToken](../modules/_celo_tokens_.md#stabletoken)): *[StableTokenContract](../modules/_base_.md#stabletokencontract)*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:228](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L228)*

Gets the contract for the provided token

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [StableToken](../modules/_celo_tokens_.md#stabletoken) | the token to get the contract of |

**Returns:** *[StableTokenContract](../modules/_base_.md#stabletokencontract)*

The contract for the token

___

###  getExchangeContract

▸ **getExchangeContract**(`token`: [StableToken](../modules/_celo_tokens_.md#stabletoken)): *[ExchangeContract](../modules/_base_.md#exchangecontract)*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:238](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L238)*

Gets the exchange contract for the provided stable token

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [StableToken](../modules/_celo_tokens_.md#stabletoken) | the stable token to get exchange contract of |

**Returns:** *[ExchangeContract](../modules/_base_.md#exchangecontract)*

The exchange contract for the token

___

###  getExchangesConfigs

▸ **getExchangesConfigs**(`humanReadable`: boolean): *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹[ExchangeConfig](../interfaces/_wrappers_exchange_.exchangeconfig.md) | object››*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:103](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L103)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`humanReadable` | boolean | false |

**Returns:** *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹[ExchangeConfig](../interfaces/_wrappers_exchange_.exchangeconfig.md) | object››*

___

###  getFeeCurrencyAddress

▸ **getFeeCurrencyAddress**(`token`: [CeloTokenType](../modules/_celo_tokens_.md#celotokentype)): *undefined | Promise‹string›*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:255](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L255)*

Gets the address to use as the feeCurrency when paying for gas with the
 provided token.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloTokenType](../modules/_celo_tokens_.md#celotokentype) | the token to get the feeCurrency address for |

**Returns:** *undefined | Promise‹string›*

If not CELO, the address of the token's contract. If CELO, undefined.

___

###  getStablesConfigs

▸ **getStablesConfigs**(`humanReadable`: boolean): *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹[StableTokenConfig](../interfaces/_wrappers_stabletokenwrapper_.stabletokenconfig.md) | object››*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L93)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`humanReadable` | boolean | false |

**Returns:** *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹[StableTokenConfig](../interfaces/_wrappers_stabletokenwrapper_.stabletokenconfig.md) | object››*

___

###  getWrapper

▸ **getWrapper**(`token`: [StableToken](../modules/_celo_tokens_.md#stabletoken)): *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)›*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:216](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L216)*

Gets the wrapper for a given celo token.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [StableToken](../modules/_celo_tokens_.md#stabletoken) | the token to get the appropriate wrapper for |

**Returns:** *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)›*

an promise resolving to the wrapper for the token

▸ **getWrapper**(`token`: [Token](../modules/_celo_tokens_.md#token)): *Promise‹[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)›*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:217](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L217)*

**Parameters:**

Name | Type |
------ | ------ |
`token` | [Token](../modules/_celo_tokens_.md#token) |

**Returns:** *Promise‹[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)›*

▸ **getWrapper**(`token`: [CeloTokenType](../modules/_celo_tokens_.md#celotokentype)): *Promise‹[CeloTokenWrapper](../modules/_celo_tokens_.md#celotokenwrapper)›*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:218](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L218)*

**Parameters:**

Name | Type |
------ | ------ |
`token` | [CeloTokenType](../modules/_celo_tokens_.md#celotokentype) |

**Returns:** *Promise‹[CeloTokenWrapper](../modules/_celo_tokens_.md#celotokenwrapper)›*

___

###  getWrappers

▸ **getWrappers**(): *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹[CeloTokenWrapper](../modules/_celo_tokens_.md#celotokenwrapper)››*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L81)*

Gets the wrapper for each celo token.

**Returns:** *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹[CeloTokenWrapper](../modules/_celo_tokens_.md#celotokenwrapper)››*

an promise resolving to an object containing the wrapper for each celo token.

___

###  isStableToken

▸ **isStableToken**(`token`: [CeloTokenType](../modules/_celo_tokens_.md#celotokentype)): *boolean*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:267](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L267)*

Returns if the provided token is a StableToken

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloTokenType](../modules/_celo_tokens_.md#celotokentype) | the token |

**Returns:** *boolean*

if token is a StableToken

___

###  validCeloTokenInfos

▸ **validCeloTokenInfos**(): *Promise‹[CeloTokenInfo](../interfaces/_celo_tokens_.celotokeninfo.md)[]›*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:176](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L176)*

**Returns:** *Promise‹[CeloTokenInfo](../interfaces/_celo_tokens_.celotokeninfo.md)[]›*

___

###  validStableTokenInfos

▸ **validStableTokenInfos**(): *Promise‹[StableTokenInfo](../interfaces/_celo_tokens_.stabletokeninfo.md)[]›*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:193](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L193)*

**Returns:** *Promise‹[StableTokenInfo](../interfaces/_celo_tokens_.stabletokeninfo.md)[]›*
