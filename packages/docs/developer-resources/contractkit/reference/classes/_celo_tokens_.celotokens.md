# Class: CeloTokens

A helper class to interact with all Celo tokens, ie CELO and stable tokens

## Hierarchy

* **CeloTokens**

## Index

### Constructors

* [constructor](_celo_tokens_.celotokens.md#constructor)

### Properties

* [kit](_celo_tokens_.celotokens.md#readonly-kit)

### Methods

* [balancesOf](_celo_tokens_.celotokens.md#balancesof)
* [forEachCeloToken](_celo_tokens_.celotokens.md#foreachcelotoken)
* [getAddress](_celo_tokens_.celotokens.md#getaddress)
* [getAddresses](_celo_tokens_.celotokens.md#getaddresses)
* [getContract](_celo_tokens_.celotokens.md#getcontract)
* [getExchangeContract](_celo_tokens_.celotokens.md#getexchangecontract)
* [getFeeCurrencyAddress](_celo_tokens_.celotokens.md#getfeecurrencyaddress)
* [getWrapper](_celo_tokens_.celotokens.md#getwrapper)
* [getWrappers](_celo_tokens_.celotokens.md#getwrappers)
* [isStableToken](_celo_tokens_.celotokens.md#isstabletoken)
* [isStableTokenContract](_celo_tokens_.celotokens.md#isstabletokencontract)

## Constructors

###  constructor

\+ **new CeloTokens**(`kit`: [ContractKit](_kit_.contractkit.md)): *[CeloTokens](_celo_tokens_.celotokens.md)*

*Defined in [contractkit/src/celo-tokens.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *[CeloTokens](_celo_tokens_.celotokens.md)*

## Properties

### `Readonly` kit

• **kit**: *[ContractKit](_kit_.contractkit.md)*

*Defined in [contractkit/src/celo-tokens.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L59)*

## Methods

###  balancesOf

▸ **balancesOf**(`address`: string): *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹BigNumber››*

*Defined in [contractkit/src/celo-tokens.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L67)*

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

*Defined in [contractkit/src/celo-tokens.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L101)*

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

###  getAddress

▸ **getAddress**(`token`: [CeloTokenType](../modules/_celo_tokens_.md#celotokentype)): *Promise‹string›*

*Defined in [contractkit/src/celo-tokens.ts:161](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L161)*

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

*Defined in [contractkit/src/celo-tokens.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L88)*

Gets the address for each celo token proxy contract.

**Returns:** *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹string››*

an promise resolving to an object containing the address for each celo token proxy.

___

###  getContract

▸ **getContract**(`token`: [StableToken](../enums/_celo_tokens_.stabletoken.md)): *[StableTokenContract](../modules/_base_.md#stabletokencontract)*

*Defined in [contractkit/src/celo-tokens.ts:142](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L142)*

Gets the contract for the provided token

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [StableToken](../enums/_celo_tokens_.stabletoken.md) | the token to get the contract of |

**Returns:** *[StableTokenContract](../modules/_base_.md#stabletokencontract)*

The contract for the token

___

###  getExchangeContract

▸ **getExchangeContract**(`token`: [StableToken](../enums/_celo_tokens_.stabletoken.md)): *[Exchange](../enums/_base_.celocontract.md#exchange)*

*Defined in [contractkit/src/celo-tokens.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L152)*

Gets the exchange contract for the provided stable token

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [StableToken](../enums/_celo_tokens_.stabletoken.md) | the stable token to get exchange contract of |

**Returns:** *[Exchange](../enums/_base_.celocontract.md#exchange)*

The exchange contract for the token

___

###  getFeeCurrencyAddress

▸ **getFeeCurrencyAddress**(`token`: [CeloTokenType](../modules/_celo_tokens_.md#celotokentype)): *undefined | Promise‹string›*

*Defined in [contractkit/src/celo-tokens.ts:171](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L171)*

Gets the address to use as the feeCurrency when paying for gas with the
 provided token.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloTokenType](../modules/_celo_tokens_.md#celotokentype) | the token to get the feeCurrency address for |

**Returns:** *undefined | Promise‹string›*

If not CELO, the address of the token's contract. If CELO, undefined.

___

###  getWrapper

▸ **getWrapper**(`token`: [StableToken](../enums/_celo_tokens_.stabletoken.md)): *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)›*

*Defined in [contractkit/src/celo-tokens.ts:132](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L132)*

Gets the wrapper for a given celo token.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [StableToken](../enums/_celo_tokens_.stabletoken.md) | the token to get the appropriate wrapper for |

**Returns:** *Promise‹[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)›*

an promise resolving to the wrapper for the token

___

###  getWrappers

▸ **getWrappers**(): *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹[CeloTokenWrapper](_wrappers_celotokenwrapper_.celotokenwrapper.md)››*

*Defined in [contractkit/src/celo-tokens.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L78)*

Gets the wrapper for each celo token.

**Returns:** *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹[CeloTokenWrapper](_wrappers_celotokenwrapper_.celotokenwrapper.md)››*

an promise resolving to an object containing the wrapper for each celo token.

___

###  isStableToken

▸ **isStableToken**(`token`: [CeloTokenType](../modules/_celo_tokens_.md#celotokentype)): *boolean*

*Defined in [contractkit/src/celo-tokens.ts:183](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L183)*

Returns if the provided token is a StableToken

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloTokenType](../modules/_celo_tokens_.md#celotokentype) | the token |

**Returns:** *boolean*

if token is a StableToken

___

###  isStableTokenContract

▸ **isStableTokenContract**(`contract`: [CeloContract](../enums/_base_.celocontract.md)): *boolean*

*Defined in [contractkit/src/celo-tokens.ts:188](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L188)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [CeloContract](../enums/_base_.celocontract.md) |

**Returns:** *boolean*
