# Class: ExchangeWrapper

Contract that allows to exchange StableToken for GoldToken and vice versa
using a Constant Product Market Maker Model

## Hierarchy

* [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)‹Exchange›

  ↳ **ExchangeWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_exchange_.exchangewrapper.md#constructor)

### Properties

* [events](_contractkit_src_wrappers_exchange_.exchangewrapper.md#events)
* [exchange](_contractkit_src_wrappers_exchange_.exchangewrapper.md#exchange)
* [getBuyAndSellBuckets](_contractkit_src_wrappers_exchange_.exchangewrapper.md#getbuyandsellbuckets)
* [getBuyTokenAmount](_contractkit_src_wrappers_exchange_.exchangewrapper.md#getbuytokenamount)
* [getSellTokenAmount](_contractkit_src_wrappers_exchange_.exchangewrapper.md#getselltokenamount)
* [lastBucketUpdate](_contractkit_src_wrappers_exchange_.exchangewrapper.md#lastbucketupdate)
* [minimumReports](_contractkit_src_wrappers_exchange_.exchangewrapper.md#minimumreports)
* [reserveFraction](_contractkit_src_wrappers_exchange_.exchangewrapper.md#reservefraction)
* [spread](_contractkit_src_wrappers_exchange_.exchangewrapper.md#spread)
* [updateFrequency](_contractkit_src_wrappers_exchange_.exchangewrapper.md#updatefrequency)

### Accessors

* [address](_contractkit_src_wrappers_exchange_.exchangewrapper.md#address)

### Methods

* [getConfig](_contractkit_src_wrappers_exchange_.exchangewrapper.md#getconfig)
* [getExchangeRate](_contractkit_src_wrappers_exchange_.exchangewrapper.md#getexchangerate)
* [getGoldExchangeRate](_contractkit_src_wrappers_exchange_.exchangewrapper.md#getgoldexchangerate)
* [getUsdExchangeRate](_contractkit_src_wrappers_exchange_.exchangewrapper.md#getusdexchangerate)
* [quoteGoldBuy](_contractkit_src_wrappers_exchange_.exchangewrapper.md#quotegoldbuy)
* [quoteGoldSell](_contractkit_src_wrappers_exchange_.exchangewrapper.md#quotegoldsell)
* [quoteUsdBuy](_contractkit_src_wrappers_exchange_.exchangewrapper.md#quoteusdbuy)
* [quoteUsdSell](_contractkit_src_wrappers_exchange_.exchangewrapper.md#quoteusdsell)
* [sellDollar](_contractkit_src_wrappers_exchange_.exchangewrapper.md#selldollar)
* [sellGold](_contractkit_src_wrappers_exchange_.exchangewrapper.md#sellgold)

## Constructors

###  constructor

\+ **new ExchangeWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: Exchange): *[ExchangeWrapper](_contractkit_src_wrappers_exchange_.exchangewrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | Exchange |

**Returns:** *[ExchangeWrapper](_contractkit_src_wrappers_exchange_.exchangewrapper.md)*

## Properties

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[events](_contractkit_src_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  exchange

• **exchange**: *function* = proxySend(
    this.kit,
    this.contract.methods.exchange,
    tupleParser(valueToString, valueToString, identity)
  )

*Defined in [contractkit/src/wrappers/Exchange.ts:109](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L109)*

Exchanges sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
Requires the sellAmount to have been approved to the exchange

**`param`** The amount of sellToken the user is selling to the exchange

**`param`** The minimum amount of buyToken the user has to receive for this
transaction to succeed

**`param`** `true` if gold is the sell token

**`returns`** The amount of buyToken that was transfered

#### Type declaration:

▸ (`sellAmount`: BigNumber.Value, `minBuyAmount`: BigNumber.Value, `sellGold`: boolean): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`sellAmount` | BigNumber.Value |
`minBuyAmount` | BigNumber.Value |
`sellGold` | boolean |

___

###  getBuyAndSellBuckets

• **getBuyAndSellBuckets**: *function* = proxyCall(
    this.contract.methods.getBuyAndSellBuckets,
    undefined,
    (callRes: { 0: string; 1: string }) =>
      [valueToBigNumber(callRes[0]), valueToBigNumber(callRes[1])] as [BigNumber, BigNumber]
  )

*Defined in [contractkit/src/wrappers/Exchange.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L93)*

Returns the buy token and sell token bucket sizes, in order. The ratio of
the two also represents the exchange rate between the two.

**`param`** `true` if gold is the sell token

**`returns`** 

#### Type declaration:

▸ (`sellGold`: boolean): *Promise‹[BigNumber, BigNumber]›*

**Parameters:**

Name | Type |
------ | ------ |
`sellGold` | boolean |

___

###  getBuyTokenAmount

• **getBuyTokenAmount**: *function* = proxyCall(
    this.contract.methods.getBuyTokenAmount,
    tupleParser(valueToString, identity),
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Exchange.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L62)*

**`dev`** Returns the amount of buyToken a user would get for sellAmount of sellToken

**`param`** The amount of sellToken the user is selling to the exchange

**`param`** `true` if gold is the sell token

**`returns`** The corresponding buyToken amount.

#### Type declaration:

▸ (`sellAmount`: BigNumber.Value, `sellGold`: boolean): *Promise‹BigNumber›*

**Parameters:**

Name | Type |
------ | ------ |
`sellAmount` | BigNumber.Value |
`sellGold` | boolean |

___

###  getSellTokenAmount

• **getSellTokenAmount**: *function* = proxyCall(
    this.contract.methods.getSellTokenAmount,
    tupleParser(valueToString, identity),
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Exchange.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L78)*

Returns the amount of sellToken a user would need to exchange to receive buyAmount of
buyToken.

**`param`** The amount of buyToken the user would like to purchase.

**`param`** `true` if gold is the sell token

**`returns`** The corresponding sellToken amount.

#### Type declaration:

▸ (`buyAmount`: BigNumber.Value, `sellGold`: boolean): *Promise‹BigNumber›*

**Parameters:**

Name | Type |
------ | ------ |
`buyAmount` | BigNumber.Value |
`sellGold` | boolean |

___

###  lastBucketUpdate

• **lastBucketUpdate**: *function* = proxyCall(this.contract.methods.lastBucketUpdate, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Exchange.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L54)*

Query last bucket update

**`returns`** The timestamp of the last time exchange buckets were updated.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  minimumReports

• **minimumReports**: *function* = proxyCall(this.contract.methods.minimumReports, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Exchange.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L49)*

Query minimum reports parameter

**`returns`** The minimum number of fresh reports that need to be
present in the oracle to update buckets
commit to the gold bucket

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  reserveFraction

• **reserveFraction**: *function* = proxyCall(this.contract.methods.reserveFraction, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Exchange.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L36)*

Query reserve fraction parameter

**`returns`** Current fraction to commit to the gold bucket

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  spread

• **spread**: *function* = proxyCall(this.contract.methods.spread, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Exchange.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L31)*

Query spread parameter

**`returns`** Current spread charged on exchanges

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  updateFrequency

• **updateFrequency**: *function* = proxyCall(this.contract.methods.updateFrequency, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Exchange.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L42)*

Query update frequency parameter

**`returns`** The time period that needs to elapse between bucket
updates

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[address](_contractkit_src_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  getConfig

▸ **getConfig**(): *Promise‹[ExchangeConfig](../interfaces/_contractkit_src_wrappers_exchange_.exchangeconfig.md)›*

*Defined in [contractkit/src/wrappers/Exchange.ts:173](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L173)*

**`dev`** Returns the current configuration of the exchange contract

**Returns:** *Promise‹[ExchangeConfig](../interfaces/_contractkit_src_wrappers_exchange_.exchangeconfig.md)›*

ExchangeConfig object

___

###  getExchangeRate

▸ **getExchangeRate**(`buyAmount`: BigNumber.Value, `sellGold`: boolean): *Promise‹BigNumber›*

*Defined in [contractkit/src/wrappers/Exchange.ts:193](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L193)*

Returns the exchange rate estimated at buyAmount.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of buyToken in wei to estimate the exchange rate at |
`sellGold` | boolean | `true` if gold is the sell token |

**Returns:** *Promise‹BigNumber›*

The exchange rate (number of sellTokens received for one buyToken).

___

###  getGoldExchangeRate

▸ **getGoldExchangeRate**(`buyAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [contractkit/src/wrappers/Exchange.ts:210](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L210)*

Returns the exchange rate for cGLD estimated at the buyAmount

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of cGLD in wei to estimate the exchange rate at |

**Returns:** *Promise‹BigNumber‹››*

The exchange rate (number of cUsd received for one cGLD)

___

###  getUsdExchangeRate

▸ **getUsdExchangeRate**(`buyAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [contractkit/src/wrappers/Exchange.ts:203](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L203)*

Returns the exchange rate for cUsd estimated at the buyAmount

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of cUsd in wei to estimate the exchange rate at |

**Returns:** *Promise‹BigNumber‹››*

The exchange rate (number of cGLD received for one cUsd)

___

###  quoteGoldBuy

▸ **quoteGoldBuy**(`buyAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [contractkit/src/wrappers/Exchange.ts:167](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L167)*

Returns the amount of cUsd a user would need to exchange to receive buyAmount of
cGLD.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of cGLD the user would like to purchase. |

**Returns:** *Promise‹BigNumber‹››*

The corresponding cUsd amount.

___

###  quoteGoldSell

▸ **quoteGoldSell**(`sellAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [contractkit/src/wrappers/Exchange.ts:151](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L151)*

Returns the amount of cUsd a user would get for sellAmount of cGLD

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sellAmount` | BigNumber.Value | The amount of cGLD the user is selling to the exchange |

**Returns:** *Promise‹BigNumber‹››*

The corresponding cUsd amount.

___

###  quoteUsdBuy

▸ **quoteUsdBuy**(`buyAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [contractkit/src/wrappers/Exchange.ts:159](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L159)*

Returns the amount of cGLD a user would need to exchange to receive buyAmount of
cUsd.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of cUsd the user would like to purchase. |

**Returns:** *Promise‹BigNumber‹››*

The corresponding cGLD amount.

___

###  quoteUsdSell

▸ **quoteUsdSell**(`sellAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [contractkit/src/wrappers/Exchange.ts:144](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L144)*

Returns the amount of cGLD a user would get for sellAmount of cUsd

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sellAmount` | BigNumber.Value | The amount of cUsd the user is selling to the exchange |

**Returns:** *Promise‹BigNumber‹››*

The corresponding cGLD amount.

___

###  sellDollar

▸ **sellDollar**(`amount`: BigNumber.Value, `minGoldAmount`: BigNumber.Value): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹string›*

*Defined in [contractkit/src/wrappers/Exchange.ts:136](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L136)*

Exchanges amount of cUsd in exchange for at least minGoldAmount of cGLD
Requires the amount to have been approved to the exchange

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | BigNumber.Value | The amount of cUsd the user is selling to the exchange |
`minGoldAmount` | BigNumber.Value | The minimum amount of cGLD the user has to receive for this transaction to succeed  |

**Returns:** *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹string›*

___

###  sellGold

▸ **sellGold**(`amount`: BigNumber.Value, `minUSDAmount`: BigNumber.Value): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹string›*

*Defined in [contractkit/src/wrappers/Exchange.ts:126](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L126)*

Exchanges amount of cGLD in exchange for at least minUsdAmount of cUsd
Requires the amount to have been approved to the exchange

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | BigNumber.Value | The amount of cGLD the user is selling to the exchange |
`minUSDAmount` | BigNumber.Value | - |

**Returns:** *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹string›*
