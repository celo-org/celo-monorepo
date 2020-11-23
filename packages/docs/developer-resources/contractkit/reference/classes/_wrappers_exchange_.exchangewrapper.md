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

* [buy](_wrappers_exchange_.exchangewrapper.md#buy)
* [eventTypes](_wrappers_exchange_.exchangewrapper.md#eventtypes)
* [events](_wrappers_exchange_.exchangewrapper.md#events)
* [exchange](_wrappers_exchange_.exchangewrapper.md#exchange)
* [getBuyAndSellBuckets](_wrappers_exchange_.exchangewrapper.md#getbuyandsellbuckets)
* [lastBucketUpdate](_wrappers_exchange_.exchangewrapper.md#lastbucketupdate)
* [methodIds](_wrappers_exchange_.exchangewrapper.md#methodids)
* [minimumReports](_wrappers_exchange_.exchangewrapper.md#minimumreports)
* [reserveFraction](_wrappers_exchange_.exchangewrapper.md#reservefraction)
* [sell](_wrappers_exchange_.exchangewrapper.md#sell)
* [spread](_wrappers_exchange_.exchangewrapper.md#spread)
* [updateFrequency](_wrappers_exchange_.exchangewrapper.md#updatefrequency)

### Accessors

* [address](_wrappers_exchange_.exchangewrapper.md#address)

### Methods

* [buyDollar](_wrappers_exchange_.exchangewrapper.md#buydollar)
* [buyGold](_wrappers_exchange_.exchangewrapper.md#buygold)
* [getBuyTokenAmount](_wrappers_exchange_.exchangewrapper.md#getbuytokenamount)
* [getConfig](_wrappers_exchange_.exchangewrapper.md#getconfig)
* [getExchangeRate](_wrappers_exchange_.exchangewrapper.md#getexchangerate)
* [getGoldExchangeRate](_wrappers_exchange_.exchangewrapper.md#getgoldexchangerate)
* [getHumanReadableConfig](_wrappers_exchange_.exchangewrapper.md#gethumanreadableconfig)
* [getPastEvents](_wrappers_exchange_.exchangewrapper.md#getpastevents)
* [getSellTokenAmount](_wrappers_exchange_.exchangewrapper.md#getselltokenamount)
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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Exchange |

**Returns:** *[ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)*

## Properties

###  buy

• **buy**: *function* = proxySend(
    this.kit,
    this.contract.methods.buy,
    tupleParser(valueToString, valueToString, identity)
  )

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:112](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L112)*

Sells sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
Requires the sellAmount to have been approved to the exchange

**`param`** The amount of sellToken the user is selling to the exchange

**`param`** The maximum amount of sellToken the user will sell for this
transaction to succeed

**`param`** `true` if gold is the buy token

**`returns`** The amount of buyToken that was transfered

#### Type declaration:

▸ (`buyAmount`: BigNumber.Value, `maxSellAmount`: BigNumber.Value, `buyGold`: boolean): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`buyAmount` | BigNumber.Value |
`maxSellAmount` | BigNumber.Value |
`buyGold` | boolean |

___

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)*

___

###  events

• **events**: *Exchange["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)*

___

###  exchange

• **exchange**: *function* = proxySend(
    this.kit,
    this.contract.methods.exchange,
    tupleParser(valueToString, valueToString, identity)
  )

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L74)*

DEPRECATED: use function sell
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

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:159](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L159)*

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

###  lastBucketUpdate

• **lastBucketUpdate**: *function* = proxyCall(this.contract.methods.lastBucketUpdate, undefined, valueToBigNumber)

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L62)*

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
        methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)*

___

###  minimumReports

• **minimumReports**: *function* = proxyCall(this.contract.methods.minimumReports, undefined, valueToBigNumber)

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L57)*

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

• **reserveFraction**: *function* = proxyCall(
    this.contract.methods.reserveFraction,
    undefined,
    fixidityValueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L40)*

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
    this.kit,
    this.contract.methods.sell,
    tupleParser(valueToString, valueToString, identity)
  )

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L93)*

Sells sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
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

###  spread

• **spread**: *function* = proxyCall(this.contract.methods.spread, undefined, fixidityValueToBigNumber)

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L35)*

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

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L50)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)*

Contract address

**Returns:** *string*

## Methods

###  buyDollar

▸ **buyDollar**(`amount`: BigNumber.Value, `maxGoldAmount`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:203](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L203)*

Buy amount of cUsd in exchange for at least minGoldAmount of CELO
Requires the amount to have been approved to the exchange

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | BigNumber.Value | The amount of cUsd the user is selling to the exchange |
`maxGoldAmount` | BigNumber.Value | The maximum amount of CELO the user will pay for this transaction to succeed  |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

___

###  buyGold

▸ **buyGold**(`amount`: BigNumber.Value, `maxUSDAmount`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:193](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L193)*

Buy amount of CELO in exchange for at most maxUsdAmount of cUsd
Requires the amount to have been approved to the exchange

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | BigNumber.Value | The amount of CELO the user is buying from the exchange |
`maxUSDAmount` | BigNumber.Value | - |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

___

###  getBuyTokenAmount

▸ **getBuyTokenAmount**(`sellAmount`: BigNumber.Value, `sellGold`: boolean): *Promise‹BigNumber›*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L128)*

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

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:240](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L240)*

**`dev`** Returns the current configuration of the exchange contract

**Returns:** *Promise‹[ExchangeConfig](../interfaces/_wrappers_exchange_.exchangeconfig.md)›*

ExchangeConfig object

___

###  getExchangeRate

▸ **getExchangeRate**(`buyAmount`: BigNumber.Value, `sellGold`: boolean): *Promise‹BigNumber›*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:276](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L276)*

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

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:293](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L293)*

Returns the exchange rate for CELO estimated at the buyAmount

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of CELO in wei to estimate the exchange rate at |

**Returns:** *Promise‹BigNumber‹››*

The exchange rate (number of cUsd received for one CELO)

___

###  getHumanReadableConfig

▸ **getHumanReadableConfig**(): *Promise‹object›*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:261](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L261)*

**`dev`** Returns human readable configuration of the exchange contract

**Returns:** *Promise‹object›*

ExchangeConfig object

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹Exchange›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)*

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

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:144](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L144)*

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

###  getUsdExchangeRate

▸ **getUsdExchangeRate**(`buyAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:286](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L286)*

Returns the exchange rate for cUsd estimated at the buyAmount

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of cUsd in wei to estimate the exchange rate at |

**Returns:** *Promise‹BigNumber‹››*

The exchange rate (number of CELO received for one cUsd)

___

###  quoteGoldBuy

▸ **quoteGoldBuy**(`buyAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:234](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L234)*

Returns the amount of cUsd a user would need to exchange to receive buyAmount of
CELO.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of CELO the user would like to purchase. |

**Returns:** *Promise‹BigNumber‹››*

The corresponding cUsd amount.

___

###  quoteGoldSell

▸ **quoteGoldSell**(`sellAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:218](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L218)*

Returns the amount of cUsd a user would get for sellAmount of CELO

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sellAmount` | BigNumber.Value | The amount of CELO the user is selling to the exchange |

**Returns:** *Promise‹BigNumber‹››*

The corresponding cUsd amount.

___

###  quoteUsdBuy

▸ **quoteUsdBuy**(`buyAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:226](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L226)*

Returns the amount of CELO a user would need to exchange to receive buyAmount of
cUsd.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`buyAmount` | BigNumber.Value | The amount of cUsd the user would like to purchase. |

**Returns:** *Promise‹BigNumber‹››*

The corresponding CELO amount.

___

###  quoteUsdSell

▸ **quoteUsdSell**(`sellAmount`: BigNumber.Value): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:211](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L211)*

Returns the amount of CELO a user would get for sellAmount of cUsd

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sellAmount` | BigNumber.Value | The amount of cUsd the user is selling to the exchange |

**Returns:** *Promise‹BigNumber‹››*

The corresponding CELO amount.

___

###  sellDollar

▸ **sellDollar**(`amount`: BigNumber.Value, `minGoldAmount`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:183](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L183)*

Sell amount of cUsd in exchange for at least minGoldAmount of CELO
Requires the amount to have been approved to the exchange

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | BigNumber.Value | The amount of cUsd the user is selling to the exchange |
`minGoldAmount` | BigNumber.Value | The minimum amount of CELO the user has to receive for this transaction to succeed  |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

___

###  sellGold

▸ **sellGold**(`amount`: BigNumber.Value, `minUSDAmount`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

*Defined in [packages/contractkit/src/wrappers/Exchange.ts:173](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L173)*

Sell amount of CELO in exchange for at least minUsdAmount of cUsd
Requires the amount to have been approved to the exchange

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | BigNumber.Value | The amount of CELO the user is selling to the exchange |
`minUSDAmount` | BigNumber.Value | - |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*
