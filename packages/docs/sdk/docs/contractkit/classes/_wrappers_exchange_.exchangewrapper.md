[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/Exchange"](../modules/_wrappers_exchange_.md) › [ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)

# Class: ExchangeWrapper

Contract that allows to exchange StableToken for GoldToken and vice versa
using a Constant Product Market Maker Model aka Mento

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Exchange›

  ↳ **ExchangeWrapper**

## Index

### Constructors

* [constructor](_wrappers_exchange_.exchangewrapper.md#constructor)

### Properties

* [buy](_wrappers_exchange_.exchangewrapper.md#buy)
* [buyDollar](_wrappers_exchange_.exchangewrapper.md#buydollar)
* [eventTypes](_wrappers_exchange_.exchangewrapper.md#eventtypes)
* [events](_wrappers_exchange_.exchangewrapper.md#events)
* [exchange](_wrappers_exchange_.exchangewrapper.md#exchange)
* [getBuyAndSellBuckets](_wrappers_exchange_.exchangewrapper.md#getbuyandsellbuckets)
* [getUsdExchangeRate](_wrappers_exchange_.exchangewrapper.md#getusdexchangerate)
* [lastBucketUpdate](_wrappers_exchange_.exchangewrapper.md#lastbucketupdate)
* [methodIds](_wrappers_exchange_.exchangewrapper.md#methodids)
* [minimumReports](_wrappers_exchange_.exchangewrapper.md#minimumreports)
* [quoteUsdBuy](_wrappers_exchange_.exchangewrapper.md#quoteusdbuy)
* [quoteUsdSell](_wrappers_exchange_.exchangewrapper.md#quoteusdsell)
* [reserveFraction](_wrappers_exchange_.exchangewrapper.md#reservefraction)
* [sell](_wrappers_exchange_.exchangewrapper.md#sell)
* [sellDollar](_wrappers_exchange_.exchangewrapper.md#selldollar)
* [spread](_wrappers_exchange_.exchangewrapper.md#spread)
* [updateFrequency](_wrappers_exchange_.exchangewrapper.md#updatefrequency)

### Accessors

* [address](_wrappers_exchange_.exchangewrapper.md#address)

### Methods

* [buyGold](_wrappers_exchange_.exchangewrapper.md#buygold)
* [buyStable](_wrappers_exchange_.exchangewrapper.md#buystable)
* [getBuyTokenAmount](_wrappers_exchange_.exchangewrapper.md#getbuytokenamount)
* [getConfig](_wrappers_exchange_.exchangewrapper.md#getconfig)
* [getExchangeRate](_wrappers_exchange_.exchangewrapper.md#getexchangerate)
* [getGoldExchangeRate](_wrappers_exchange_.exchangewrapper.md#getgoldexchangerate)
* [getHumanReadableConfig](_wrappers_exchange_.exchangewrapper.md#gethumanreadableconfig)
* [getPastEvents](_wrappers_exchange_.exchangewrapper.md#getpastevents)
* [getSellTokenAmount](_wrappers_exchange_.exchangewrapper.md#getselltokenamount)
* [getStableExchangeRate](_wrappers_exchange_.exchangewrapper.md#getstableexchangerate)
* [quoteGoldBuy](_wrappers_exchange_.exchangewrapper.md#quotegoldbuy)
* [quoteGoldSell](_wrappers_exchange_.exchangewrapper.md#quotegoldsell)
* [quoteStableBuy](_wrappers_exchange_.exchangewrapper.md#quotestablebuy)
* [quoteStableSell](_wrappers_exchange_.exchangewrapper.md#quotestablesell)
* [sellGold](_wrappers_exchange_.exchangewrapper.md#sellgold)
* [sellStable](_wrappers_exchange_.exchangewrapper.md#sellstable)
* [version](_wrappers_exchange_.exchangewrapper.md#version)

## Constructors

###  constructor

\+ **new ExchangeWrapper**(`connection`: Connection, `contract`: Exchange): *[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | Exchange |

**Returns:** *[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)*

## Properties

###  buy

• **buy**: *function* = proxySend(
    this.connection,
    this.contract.methods.buy,
    tupleParser(valueToString, valueToString, identity)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:112](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L112)*

Sells sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
Requires the sellAmount to have been approved to the exchange

**`param`** The amount of sellToken the user is selling to the exchange

**`param`** The maximum amount of sellToken the user will sell for this
transaction to succeed

**`param`** `true` if gold is the buy token

**`returns`** The amount of buyToken that was transfered

#### Type declaration:

▸ (`buyAmount`: BigNumber.Value, `maxSellAmount`: BigNumber.Value, `buyGold`: boolean): *CeloTransactionObject‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`buyAmount` | BigNumber.Value |
`maxSellAmount` | BigNumber.Value |
`buyGold` | boolean |

___

###  buyDollar

• **buyDollar**: *(Anonymous function)* = this.buyStable

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:226](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L226)*

Deprecated alias of buyStable.
Buy amount of the stable token in exchange for at least minGoldAmount of CELO
Requires the amount to have been approved to the exchange

**`deprecated`** use buyStable instead

**`param`** The amount of the stable token the user is selling to the exchange

**`param`** The maximum amount of CELO the user will pay for this
transaction to succeed

___

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L63)*

___

###  events

• **events**: *Exchange["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  exchange

• **exchange**: *function* = proxySend(
    this.connection,
    this.contract.methods.exchange,
    tupleParser(valueToString, valueToString, identity)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L74)*

DEPRECATED: use function sell
Exchanges sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
Requires the sellAmount to have been approved to the exchange

**`param`** The amount of sellToken the user is selling to the exchange

**`param`** The minimum amount of buyToken the user has to receive for this
transaction to succeed

**`param`** `true` if gold is the sell token

**`returns`** The amount of buyToken that was transfered

#### Type declaration:

▸ (`sellAmount`: BigNumber.Value, `minBuyAmount`: BigNumber.Value, `sellGold`: boolean): *CeloTransactionObject‹string›*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:159](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L159)*

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

###  getUsdExchangeRate

• **getUsdExchangeRate**: *(Anonymous function)* = this.getStableExchangeRate

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:336](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L336)*

Deprecated alias of getStableExchangeRate.
Returns the exchange rate for the stable token estimated at the buyAmount

**`deprecated`** Use getStableExchangeRate instead

**`param`** The amount of the stable token in wei to estimate the exchange rate at

**`returns`** The exchange rate (number of CELO received for one stable token)

___

###  lastBucketUpdate

• **lastBucketUpdate**: *function* = proxyCall(this.contract.methods.lastBucketUpdate, undefined, valueToBigNumber)

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L62)*

Query last bucket update

**`returns`** The timestamp of the last time exchange buckets were updated.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  methodIds

• **methodIds**: *Record‹keyof T["methods"], string›* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined
          ? '0x'
          : this.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L68)*

___

###  minimumReports

• **minimumReports**: *function* = proxyCall(this.contract.methods.minimumReports, undefined, valueToBigNumber)

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L57)*

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

###  quoteUsdBuy

• **quoteUsdBuy**: *(Anonymous function)* = this.quoteStableBuy

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:267](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L267)*

Deprecated alias of quoteStableBuy.
Returns the amount of CELO a user would need to exchange to receive buyAmount of
the stable token.

**`deprecated`** Use quoteStableBuy instead

**`param`** The amount of the stable token the user would like to purchase.

**`returns`** The corresponding CELO amount.

___

###  quoteUsdSell

• **quoteUsdSell**: *(Anonymous function)* = this.quoteStableSell

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:242](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L242)*

Deprecated alias of quoteStableSell.
Returns the amount of CELO a user would get for sellAmount of the stable token

**`deprecated`** Use quoteStableSell instead

**`param`** The amount of the stable token the user is selling to the exchange

**`returns`** The corresponding CELO amount.

___

###  reserveFraction

• **reserveFraction**: *function* = proxyCall(
    this.contract.methods.reserveFraction,
    undefined,
    fixidityValueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L40)*

Query reserve fraction parameter

**`returns`** Current fraction to commit to the gold bucket

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  sell

• **sell**: *function* = proxySend(
    this.connection,
    this.contract.methods.sell,
    tupleParser(valueToString, valueToString, identity)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L93)*

Sells sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
Requires the sellAmount to have been approved to the exchange

**`param`** The amount of sellToken the user is selling to the exchange

**`param`** The minimum amount of buyToken the user has to receive for this
transaction to succeed

**`param`** `true` if gold is the sell token

**`returns`** The amount of buyToken that was transfered

#### Type declaration:

▸ (`sellAmount`: BigNumber.Value, `minBuyAmount`: BigNumber.Value, `sellGold`: boolean): *CeloTransactionObject‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`sellAmount` | BigNumber.Value |
`minBuyAmount` | BigNumber.Value |
`sellGold` | boolean |

___

###  sellDollar

• **sellDollar**: *(Anonymous function)* = this.sellStable

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:195](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L195)*

Deprecated alias of sellStable.
Sell amount of the stable token in exchange for at least minGoldAmount of CELO
Requires the amount to have been approved to the exchange

**`deprecated`** use sellStable instead

**`param`** The amount of the stable token the user is selling to the exchange

**`param`** The minimum amount of CELO the user has to receive for this
transaction to succeed

___

###  spread

• **spread**: *function* = proxyCall(this.contract.methods.spread, undefined, fixidityValueToBigNumber)

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L35)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L50)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  buyGold

▸ **buyGold**(`amount`: BigNumber.Value, `maxStableAmount`: BigNumber.Value): *CeloTransactionObject‹string›*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:204](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L204)*

Buy amount of CELO in exchange for at most maxStableAmount of the stable token
Requires the amount to have been approved to the exchange

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | BigNumber.Value | The amount of CELO the user is buying from the exchange |
`maxStableAmount` | BigNumber.Value | The maximum amount of the stable token the user will pay for this transaction to succeed  |

**Returns:** *CeloTransactionObject‹string›*

___

###  buyStable

▸ **buyStable**(`amount`: BigNumber.Value, `maxGoldAmount`: BigNumber.Value): *CeloTransactionObject‹string›*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:214](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L214)*

Buy amount of the stable token in exchange for at least minGoldAmount of CELO
Requires the amount to have been approved to the exchange

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | BigNumber.Value | The amount of the stable token the user is selling to the exchange |
`maxGoldAmount` | BigNumber.Value | The maximum amount of CELO the user will pay for this transaction to succeed  |

**Returns:** *CeloTransactionObject‹string›*

___

###  getBuyTokenAmount

▸ **getBuyTokenAmount**(`sellAmount`: BigNumber.Value, `sellGold`: boolean): *Promise‹BigNumber›*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L128)*

**`dev`** Returns the amount of buyToken a user would get for sellAmount of sellToken

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sellAmount` | BigNumber.Value | The amount of sellToken the user is selling to the exchange |
`sellGold` | boolean | `true` if gold is the sell token |

**Returns:** *Promise‹BigNumber›*

The corresponding buyToken amount.

___

###  getConfig

▸ **getConfig**(): *Promise‹[ExchangeConfig](../interfaces/_wrappers_exchange_.exchangeconfig.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:281](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L281)*

**`dev`** Returns the current configuration of the exchange contract

**Returns:** *Promise‹[ExchangeConfig](../interfaces/_wrappers_exchange_.exchangeconfig.md)›*

ExchangeConfig object

___

###  getExchangeRate

▸ **getExchangeRate**(`buyAmount`: BigNumber.Value, `sellGold`: boolean): *Promise‹BigNumber›*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:317](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L317)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:343](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L343)*

Returns the exchange rate for CELO estimated at the buyAmount

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of CELO in wei to estimate the exchange rate at |

**Returns:** *Promise‹BigNumber‹››*

The exchange rate (number of stable tokens received for one CELO)

___

###  getHumanReadableConfig

▸ **getHumanReadableConfig**(): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:302](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L302)*

**`dev`** Returns human readable configuration of the exchange contract

**Returns:** *Promise‹object›*

ExchangeConfig object

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹Exchange›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹Exchange› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getSellTokenAmount

▸ **getSellTokenAmount**(`buyAmount`: BigNumber.Value, `sellGold`: boolean): *Promise‹BigNumber›*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:144](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L144)*

Returns the amount of sellToken a user would need to exchange to receive buyAmount of
buyToken.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of buyToken the user would like to purchase. |
`sellGold` | boolean | `true` if gold is the sell token |

**Returns:** *Promise‹BigNumber›*

The corresponding sellToken amount.

___

###  getStableExchangeRate

▸ **getStableExchangeRate**(`buyAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:327](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L327)*

Returns the exchange rate for the stable token estimated at the buyAmount

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of the stable token in wei to estimate the exchange rate at |

**Returns:** *Promise‹BigNumber‹››*

The exchange rate (number of CELO received for one stable token)

___

###  quoteGoldBuy

▸ **quoteGoldBuy**(`buyAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:275](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L275)*

Returns the amount of the stable token a user would need to exchange to receive buyAmount of
CELO.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of CELO the user would like to purchase. |

**Returns:** *Promise‹BigNumber‹››*

The corresponding stable token amount.

___

###  quoteGoldSell

▸ **quoteGoldSell**(`sellAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:249](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L249)*

Returns the amount of the stable token a user would get for sellAmount of CELO

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sellAmount` | BigNumber.Value | The amount of CELO the user is selling to the exchange |

**Returns:** *Promise‹BigNumber‹››*

The corresponding stable token amount.

___

###  quoteStableBuy

▸ **quoteStableBuy**(`buyAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:257](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L257)*

Returns the amount of CELO a user would need to exchange to receive buyAmount of
the stable token.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of the stable token the user would like to purchase. |

**Returns:** *Promise‹BigNumber‹››*

The corresponding CELO amount.

___

###  quoteStableSell

▸ **quoteStableSell**(`sellAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:233](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L233)*

Returns the amount of CELO a user would get for sellAmount of the stable token

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sellAmount` | BigNumber.Value | The amount of the stable token the user is selling to the exchange |

**Returns:** *Promise‹BigNumber‹››*

The corresponding CELO amount.

___

###  sellGold

▸ **sellGold**(`amount`: BigNumber.Value, `minStableAmount`: BigNumber.Value): *CeloTransactionObject‹string›*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:173](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L173)*

Sell amount of CELO in exchange for at least minStableAmount of the stable token
Requires the amount to have been approved to the exchange

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | BigNumber.Value | The amount of CELO the user is selling to the exchange |
`minStableAmount` | BigNumber.Value | The minimum amount of the stable token the user has to receive for this transaction to succeed  |

**Returns:** *CeloTransactionObject‹string›*

___

###  sellStable

▸ **sellStable**(`amount`: BigNumber.Value, `minGoldAmount`: BigNumber.Value): *CeloTransactionObject‹string›*

*Defined in [packages/sdk/contractkit/src/wrappers/Exchange.ts:183](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L183)*

Sell amount of the stable token in exchange for at least minGoldAmount of CELO
Requires the amount to have been approved to the exchange

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | BigNumber.Value | The amount of the stable token the user is selling to the exchange |
`minGoldAmount` | BigNumber.Value | The minimum amount of CELO the user has to receive for this transaction to succeed  |

**Returns:** *CeloTransactionObject‹string›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
