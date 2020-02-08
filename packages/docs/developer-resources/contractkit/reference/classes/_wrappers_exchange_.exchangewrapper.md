# Class: ExchangeWrapper

Contract that allows to exchange StableToken for GoldToken and vice versa
using a Constant Product Market Maker Model

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Exchange›

  ↳ **ExchangeWrapper**

## Index

### Constructors

* [constructor](_wrappers_exchange_.exchangewrapper.md#constructor)

### Properties

* [exchange](_wrappers_exchange_.exchangewrapper.md#exchange)
* [getBuyAndSellBuckets](_wrappers_exchange_.exchangewrapper.md#getbuyandsellbuckets)
* [getBuyTokenAmount](_wrappers_exchange_.exchangewrapper.md#getbuytokenamount)
* [getSellTokenAmount](_wrappers_exchange_.exchangewrapper.md#getselltokenamount)
* [minimumReports](_wrappers_exchange_.exchangewrapper.md#minimumreports)
* [reserveFraction](_wrappers_exchange_.exchangewrapper.md#reservefraction)
* [spread](_wrappers_exchange_.exchangewrapper.md#spread)
* [updateFrequency](_wrappers_exchange_.exchangewrapper.md#updatefrequency)

### Accessors

* [address](_wrappers_exchange_.exchangewrapper.md#address)

### Methods

* [getConfig](_wrappers_exchange_.exchangewrapper.md#getconfig)
* [getExchangeRate](_wrappers_exchange_.exchangewrapper.md#getexchangerate)
* [getGoldExchangeRate](_wrappers_exchange_.exchangewrapper.md#getgoldexchangerate)
* [getUsdExchangeRate](_wrappers_exchange_.exchangewrapper.md#getusdexchangerate)
* [quoteGoldBuy](_wrappers_exchange_.exchangewrapper.md#quotegoldbuy)
* [quoteGoldSell](_wrappers_exchange_.exchangewrapper.md#quotegoldsell)
* [quoteUsdBuy](_wrappers_exchange_.exchangewrapper.md#quoteusdbuy)
* [quoteUsdSell](_wrappers_exchange_.exchangewrapper.md#quoteusdsell)
* [sellDollar](_wrappers_exchange_.exchangewrapper.md#selldollar)
* [sellGold](_wrappers_exchange_.exchangewrapper.md#sellgold)

## Constructors

###  constructor

\+ **new ExchangeWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Exchange): *[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Exchange |

**Returns:** *[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)*

## Properties

###  exchange

• **exchange**: *function* = proxySend(
    this.kit,
    this.contract.methods.exchange,
    tupleParser(valueToString, valueToString, identity)
  )

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L104)*

Exchanges sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
Requires the sellAmount to have been approved to the exchange

**`param`** The amount of sellToken the user is selling to the exchange

**`param`** The minimum amount of buyToken the user has to receive for this
transaction to succeed

**`param`** `true` if gold is the sell token

**`returns`** The amount of buyToken that was transfered

#### Type declaration:

▸ (`sellAmount`: BigNumber.Value, `minBuyAmount`: BigNumber.Value, `sellGold`: boolean): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

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

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L88)*

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

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L57)*

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

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L73)*

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

###  minimumReports

• **minimumReports**: *function* = proxyCall(this.contract.methods.minimumReports, undefined, valueToBigNumber)

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L49)*

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

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L36)*

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

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L31)*

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

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L42)*

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

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L18)*

Contract address

**Returns:** *string*

## Methods

###  getConfig

▸ **getConfig**(): *Promise‹[ExchangeConfig](../interfaces/_wrappers_exchange_.exchangeconfig.md)›*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:168](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L168)*

**`dev`** Returns the current configuration of the exchange contract

**Returns:** *Promise‹[ExchangeConfig](../interfaces/_wrappers_exchange_.exchangeconfig.md)›*

ExchangeConfig object

___

###  getExchangeRate

▸ **getExchangeRate**(`buyAmount`: BigNumber.Value, `sellGold`: boolean): *Promise‹BigNumber›*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:188](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L188)*

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

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:205](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L205)*

Returns the exchange rate for cGold estimated at the buyAmount

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of cGold in wei to estimate the exchange rate at |

**Returns:** *Promise‹BigNumber‹››*

The exchange rate (number of cUsd received for one cGold)

___

###  getUsdExchangeRate

▸ **getUsdExchangeRate**(`buyAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:198](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L198)*

Returns the exchange rate for cUsd estimated at the buyAmount

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of cUsd in wei to estimate the exchange rate at |

**Returns:** *Promise‹BigNumber‹››*

The exchange rate (number of cGold received for one cUsd)

___

###  quoteGoldBuy

▸ **quoteGoldBuy**(`buyAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:162](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L162)*

Returns the amount of cUsd a user would need to exchange to receive buyAmount of
cGold.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of cGold the user would like to purchase. |

**Returns:** *Promise‹BigNumber‹››*

The corresponding cUsd amount.

___

###  quoteGoldSell

▸ **quoteGoldSell**(`sellAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:146](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L146)*

Returns the amount of cUsd a user would get for sellAmount of cGold

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sellAmount` | BigNumber.Value | The amount of cGold the user is selling to the exchange |

**Returns:** *Promise‹BigNumber‹››*

The corresponding cUsd amount.

___

###  quoteUsdBuy

▸ **quoteUsdBuy**(`buyAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:154](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L154)*

Returns the amount of cGold a user would need to exchange to receive buyAmount of
cUsd.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of cUsd the user would like to purchase. |

**Returns:** *Promise‹BigNumber‹››*

The corresponding cGold amount.

___

###  quoteUsdSell

▸ **quoteUsdSell**(`sellAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:139](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L139)*

Returns the amount of cGold a user would get for sellAmount of cUsd

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sellAmount` | BigNumber.Value | The amount of cUsd the user is selling to the exchange |

**Returns:** *Promise‹BigNumber‹››*

The corresponding cGold amount.

___

###  sellDollar

▸ **sellDollar**(`amount`: BigNumber.Value, `minGoldAmount`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:131](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L131)*

Exchanges amount of cUsd in exchange for at least minGoldAmount of cGold
Requires the amount to have been approved to the exchange

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | BigNumber.Value | The amount of cUsd the user is selling to the exchange |
`minGoldAmount` | BigNumber.Value | The minimum amount of cGold the user has to receive for this transaction to succeed  |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

___

###  sellGold

▸ **sellGold**(`amount`: BigNumber.Value, `minUSDAmount`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L121)*

Exchanges amount of cGold in exchange for at least minUsdAmount of cUsd
Requires the amount to have been approved to the exchange

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | BigNumber.Value | The amount of cGold the user is selling to the exchange |
`minUSDAmount` | BigNumber.Value | - |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*
