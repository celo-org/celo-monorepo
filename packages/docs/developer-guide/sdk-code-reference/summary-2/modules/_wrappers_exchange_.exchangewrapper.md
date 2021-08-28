# ExchangeWrapper

Contract that allows to exchange StableToken for GoldToken and vice versa using a Constant Product Market Maker Model

## Hierarchy

* [BaseWrapper]()‹Exchange›

  ↳ **ExchangeWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [buy]()
* [eventTypes]()
* [events]()
* [exchange]()
* [getBuyAndSellBuckets]()
* [lastBucketUpdate]()
* [methodIds]()
* [minimumReports]()
* [reserveFraction]()
* [sell]()
* [spread]()
* [updateFrequency]()

### Accessors

* [address]()

### Methods

* [buyDollar]()
* [buyGold]()
* [getBuyTokenAmount]()
* [getConfig]()
* [getExchangeRate]()
* [getGoldExchangeRate]()
* [getHumanReadableConfig]()
* [getPastEvents]()
* [getSellTokenAmount]()
* [getUsdExchangeRate]()
* [quoteGoldBuy]()
* [quoteGoldSell]()
* [quoteUsdBuy]()
* [quoteUsdSell]()
* [sellDollar]()
* [sellGold]()

## Constructors

### constructor

+ **new ExchangeWrapper**\(`kit`: [ContractKit](), `contract`: Exchange\): [_ExchangeWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Exchange |

**Returns:** [_ExchangeWrapper_]()

## Properties

### buy

• **buy**: _function_ = proxySend\( this.kit, this.contract.methods.buy, tupleParser\(valueToString, valueToString, identity\) \)

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:112_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L112)

Sells sellAmount of sellToken in exchange for at least minBuyAmount of buyToken Requires the sellAmount to have been approved to the exchange

**`param`** The amount of sellToken the user is selling to the exchange

**`param`** The maximum amount of sellToken the user will sell for this transaction to succeed

**`param`** `true` if gold is the buy token

**`returns`** The amount of buyToken that was transfered

#### Type declaration:

▸ \(`buyAmount`: BigNumber.Value, `maxSellAmount`: BigNumber.Value, `buyGold`: boolean\): _CeloTransactionObject‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `buyAmount` | BigNumber.Value |
| `maxSellAmount` | BigNumber.Value |
| `buyGold` | boolean |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _Exchange\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### exchange

• **exchange**: _function_ = proxySend\( this.kit, this.contract.methods.exchange, tupleParser\(valueToString, valueToString, identity\) \)

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:74_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L74)

DEPRECATED: use function sell Exchanges sellAmount of sellToken in exchange for at least minBuyAmount of buyToken Requires the sellAmount to have been approved to the exchange

**`param`** The amount of sellToken the user is selling to the exchange

**`param`** The minimum amount of buyToken the user has to receive for this transaction to succeed

**`param`** `true` if gold is the sell token

**`returns`** The amount of buyToken that was transfered

#### Type declaration:

▸ \(`sellAmount`: BigNumber.Value, `minBuyAmount`: BigNumber.Value, `sellGold`: boolean\): _CeloTransactionObject‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `sellAmount` | BigNumber.Value |
| `minBuyAmount` | BigNumber.Value |
| `sellGold` | boolean |

### getBuyAndSellBuckets

• **getBuyAndSellBuckets**: _function_ = proxyCall\( this.contract.methods.getBuyAndSellBuckets, undefined, \(callRes: { 0: string; 1: string }\) =&gt; \[valueToBigNumber\(callRes\[0\]\), valueToBigNumber\(callRes\[1\]\)\] as \[BigNumber, BigNumber\] \)

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:159_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L159)

Returns the buy token and sell token bucket sizes, in order. The ratio of the two also represents the exchange rate between the two.

**`param`** `true` if gold is the sell token

**`returns`**

#### Type declaration:

▸ \(`sellGold`: boolean\): _Promise‹\[BigNumber, BigNumber\]›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `sellGold` | boolean |

### lastBucketUpdate

• **lastBucketUpdate**: _function_ = proxyCall\(this.contract.methods.lastBucketUpdate, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L62)

Query last bucket update

**`returns`** The timestamp of the last time exchange buckets were updated.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### methodIds

• **methodIds**: _Record‹keyof T\["methods"\], string›_ = Object.keys\(this.contract.methods\).reduce, string&gt;&gt;\( \(acc, method: Methods\) =&gt; { const methodABI = this.contract.options.jsonInterface.find\(\(item\) =&gt; item.name === method\)

```text
  acc[method] =
    methodABI === undefined
      ? '0x'
      : this.kit.connection.getAbiCoder().encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_]()_._[_methodIds_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)

### minimumReports

• **minimumReports**: _function_ = proxyCall\(this.contract.methods.minimumReports, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:57_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L57)

Query minimum reports parameter

**`returns`** The minimum number of fresh reports that need to be present in the oracle to update buckets commit to the gold bucket

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### reserveFraction

• **reserveFraction**: _function_ = proxyCall\( this.contract.methods.reserveFraction, undefined, fixidityValueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L40)

Query reserve fraction parameter

**`returns`** Current fraction to commit to the gold bucket

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### sell

• **sell**: _function_ = proxySend\( this.kit, this.contract.methods.sell, tupleParser\(valueToString, valueToString, identity\) \)

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L93)

Sells sellAmount of sellToken in exchange for at least minBuyAmount of buyToken Requires the sellAmount to have been approved to the exchange

**`param`** The amount of sellToken the user is selling to the exchange

**`param`** The minimum amount of buyToken the user has to receive for this transaction to succeed

**`param`** `true` if gold is the sell token

**`returns`** The amount of buyToken that was transfered

#### Type declaration:

▸ \(`sellAmount`: BigNumber.Value, `minBuyAmount`: BigNumber.Value, `sellGold`: boolean\): _CeloTransactionObject‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `sellAmount` | BigNumber.Value |
| `minBuyAmount` | BigNumber.Value |
| `sellGold` | boolean |

### spread

• **spread**: _function_ = proxyCall\(this.contract.methods.spread, undefined, fixidityValueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L35)

Query spread parameter

**`returns`** Current spread charged on exchanges

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### updateFrequency

• **updateFrequency**: _function_ = proxyCall\(this.contract.methods.updateFrequency, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:50_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L50)

Query update frequency parameter

**`returns`** The time period that needs to elapse between bucket updates

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### buyDollar

▸ **buyDollar**\(`amount`: BigNumber.Value, `maxGoldAmount`: BigNumber.Value\): _CeloTransactionObject‹string›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:203_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L203)

Buy amount of cUsd in exchange for at least minGoldAmount of CELO Requires the amount to have been approved to the exchange

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `amount` | BigNumber.Value | The amount of cUsd the user is selling to the exchange |
| `maxGoldAmount` | BigNumber.Value | The maximum amount of CELO the user will pay for this transaction to succeed |

**Returns:** _CeloTransactionObject‹string›_

### buyGold

▸ **buyGold**\(`amount`: BigNumber.Value, `maxUSDAmount`: BigNumber.Value\): _CeloTransactionObject‹string›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:193_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L193)

Buy amount of CELO in exchange for at most maxUsdAmount of cUsd Requires the amount to have been approved to the exchange

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `amount` | BigNumber.Value | The amount of CELO the user is buying from the exchange |
| `maxUSDAmount` | BigNumber.Value | - |

**Returns:** _CeloTransactionObject‹string›_

### getBuyTokenAmount

▸ **getBuyTokenAmount**\(`sellAmount`: BigNumber.Value, `sellGold`: boolean\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:128_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L128)

**`dev`** Returns the amount of buyToken a user would get for sellAmount of sellToken

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `sellAmount` | BigNumber.Value | The amount of sellToken the user is selling to the exchange |
| `sellGold` | boolean | `true` if gold is the sell token |

**Returns:** _Promise‹BigNumber›_

The corresponding buyToken amount.

### getConfig

▸ **getConfig**\(\): _Promise‹_[_ExchangeConfig_]()_›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:240_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L240)

**`dev`** Returns the current configuration of the exchange contract

**Returns:** _Promise‹_[_ExchangeConfig_]()_›_

ExchangeConfig object

### getExchangeRate

▸ **getExchangeRate**\(`buyAmount`: BigNumber.Value, `sellGold`: boolean\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:276_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L276)

Returns the exchange rate estimated at buyAmount.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `buyAmount` | BigNumber.Value | The amount of buyToken in wei to estimate the exchange rate at |
| `sellGold` | boolean | `true` if gold is the sell token |

**Returns:** _Promise‹BigNumber›_

The exchange rate \(number of sellTokens received for one buyToken\).

### getGoldExchangeRate

▸ **getGoldExchangeRate**\(`buyAmount`: BigNumber.Value\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:293_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L293)

Returns the exchange rate for CELO estimated at the buyAmount

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `buyAmount` | BigNumber.Value | The amount of CELO in wei to estimate the exchange rate at |

**Returns:** _Promise‹BigNumber‹››_

The exchange rate \(number of cUsd received for one CELO\)

### getHumanReadableConfig

▸ **getHumanReadableConfig**\(\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:261_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L261)

**`dev`** Returns human readable configuration of the exchange contract

**Returns:** _Promise‹object›_

ExchangeConfig object

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Exchange›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Exchange› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getSellTokenAmount

▸ **getSellTokenAmount**\(`buyAmount`: BigNumber.Value, `sellGold`: boolean\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:144_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L144)

Returns the amount of sellToken a user would need to exchange to receive buyAmount of buyToken.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `buyAmount` | BigNumber.Value | The amount of buyToken the user would like to purchase. |
| `sellGold` | boolean | `true` if gold is the sell token |

**Returns:** _Promise‹BigNumber›_

The corresponding sellToken amount.

### getUsdExchangeRate

▸ **getUsdExchangeRate**\(`buyAmount`: BigNumber.Value\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:286_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L286)

Returns the exchange rate for cUsd estimated at the buyAmount

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `buyAmount` | BigNumber.Value | The amount of cUsd in wei to estimate the exchange rate at |

**Returns:** _Promise‹BigNumber‹››_

The exchange rate \(number of CELO received for one cUsd\)

### quoteGoldBuy

▸ **quoteGoldBuy**\(`buyAmount`: BigNumber.Value\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:234_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L234)

Returns the amount of cUsd a user would need to exchange to receive buyAmount of CELO.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `buyAmount` | BigNumber.Value | The amount of CELO the user would like to purchase. |

**Returns:** _Promise‹BigNumber‹››_

The corresponding cUsd amount.

### quoteGoldSell

▸ **quoteGoldSell**\(`sellAmount`: BigNumber.Value\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:218_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L218)

Returns the amount of cUsd a user would get for sellAmount of CELO

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `sellAmount` | BigNumber.Value | The amount of CELO the user is selling to the exchange |

**Returns:** _Promise‹BigNumber‹››_

The corresponding cUsd amount.

### quoteUsdBuy

▸ **quoteUsdBuy**\(`buyAmount`: BigNumber.Value\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:226_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L226)

Returns the amount of CELO a user would need to exchange to receive buyAmount of cUsd.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `buyAmount` | BigNumber.Value | The amount of cUsd the user would like to purchase. |

**Returns:** _Promise‹BigNumber‹››_

The corresponding CELO amount.

### quoteUsdSell

▸ **quoteUsdSell**\(`sellAmount`: BigNumber.Value\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:211_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L211)

Returns the amount of CELO a user would get for sellAmount of cUsd

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `sellAmount` | BigNumber.Value | The amount of cUsd the user is selling to the exchange |

**Returns:** _Promise‹BigNumber‹››_

The corresponding CELO amount.

### sellDollar

▸ **sellDollar**\(`amount`: BigNumber.Value, `minGoldAmount`: BigNumber.Value\): _CeloTransactionObject‹string›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:183_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L183)

Sell amount of cUsd in exchange for at least minGoldAmount of CELO Requires the amount to have been approved to the exchange

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `amount` | BigNumber.Value | The amount of cUsd the user is selling to the exchange |
| `minGoldAmount` | BigNumber.Value | The minimum amount of CELO the user has to receive for this transaction to succeed |

**Returns:** _CeloTransactionObject‹string›_

### sellGold

▸ **sellGold**\(`amount`: BigNumber.Value, `minUSDAmount`: BigNumber.Value\): _CeloTransactionObject‹string›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:173_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Exchange.ts#L173)

Sell amount of CELO in exchange for at least minUsdAmount of cUsd Requires the amount to have been approved to the exchange

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `amount` | BigNumber.Value | The amount of CELO the user is selling to the exchange |
| `minUSDAmount` | BigNumber.Value | - |

**Returns:** _CeloTransactionObject‹string›_

