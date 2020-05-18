# ExchangeWrapper

Contract that allows to exchange StableToken for GoldToken and vice versa using a Constant Product Market Maker Model

## Hierarchy

* [BaseWrapper]()‹Exchange›

  ↳ **ExchangeWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [events]()
* [exchange]()
* [getBuyAndSellBuckets]()
* [lastBucketUpdate]()
* [minimumReports]()
* [reserveFraction]()
* [spread]()
* [updateFrequency]()

### Accessors

* [address]()

### Methods

* [getBuyTokenAmount]()
* [getConfig]()
* [getExchangeRate]()
* [getGoldExchangeRate]()
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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Exchange |

**Returns:** [_ExchangeWrapper_]()

## Properties

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### exchange

• **exchange**: _function_ = proxySend\( this.kit, this.contract.methods.exchange, tupleParser\(valueToString, valueToString, identity\) \)

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:115_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L115)

Exchanges sellAmount of sellToken in exchange for at least minBuyAmount of buyToken Requires the sellAmount to have been approved to the exchange

**`param`** The amount of sellToken the user is selling to the exchange

**`param`** The minimum amount of buyToken the user has to receive for this transaction to succeed

**`param`** `true` if gold is the sell token

**`returns`** The amount of buyToken that was transfered

#### Type declaration:

▸ \(`sellAmount`: BigNumber.Value, `minBuyAmount`: BigNumber.Value, `sellGold`: boolean\): [_CeloTransactionObject_]()_‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `sellAmount` | BigNumber.Value |
| `minBuyAmount` | BigNumber.Value |
| `sellGold` | boolean |

### getBuyAndSellBuckets

• **getBuyAndSellBuckets**: _function_ = proxyCall\( this.contract.methods.getBuyAndSellBuckets, undefined, \(callRes: { 0: string; 1: string }\) =&gt; \[valueToBigNumber\(callRes\[0\]\), valueToBigNumber\(callRes\[1\]\)\] as \[BigNumber, BigNumber\] \)

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L99)

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

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L60)

Query last bucket update

**`returns`** The timestamp of the last time exchange buckets were updated.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### minimumReports

• **minimumReports**: _function_ = proxyCall\(this.contract.methods.minimumReports, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L55)

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

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L38)

Query reserve fraction parameter

**`returns`** Current fraction to commit to the gold bucket

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### spread

• **spread**: _function_ = proxyCall\(this.contract.methods.spread, undefined, fixidityValueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L33)

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

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L48)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### getBuyTokenAmount

▸ **getBuyTokenAmount**\(`sellAmount`: BigNumber.Value, `sellGold`: boolean\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L68)

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

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:179_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L179)

**`dev`** Returns the current configuration of the exchange contract

**Returns:** _Promise‹_[_ExchangeConfig_]()_›_

ExchangeConfig object

### getExchangeRate

▸ **getExchangeRate**\(`buyAmount`: BigNumber.Value, `sellGold`: boolean\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:201_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L201)

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

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:218_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L218)

Returns the exchange rate for cGLD estimated at the buyAmount

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `buyAmount` | BigNumber.Value | The amount of cGLD in wei to estimate the exchange rate at |

**Returns:** _Promise‹BigNumber‹››_

The exchange rate \(number of cUsd received for one cGLD\)

### getSellTokenAmount

▸ **getSellTokenAmount**\(`buyAmount`: BigNumber.Value, `sellGold`: boolean\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:84_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L84)

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

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:211_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L211)

Returns the exchange rate for cUsd estimated at the buyAmount

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `buyAmount` | BigNumber.Value | The amount of cUsd in wei to estimate the exchange rate at |

**Returns:** _Promise‹BigNumber‹››_

The exchange rate \(number of cGLD received for one cUsd\)

### quoteGoldBuy

▸ **quoteGoldBuy**\(`buyAmount`: BigNumber.Value\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:173_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L173)

Returns the amount of cUsd a user would need to exchange to receive buyAmount of cGLD.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `buyAmount` | BigNumber.Value | The amount of cGLD the user would like to purchase. |

**Returns:** _Promise‹BigNumber‹››_

The corresponding cUsd amount.

### quoteGoldSell

▸ **quoteGoldSell**\(`sellAmount`: BigNumber.Value\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L157)

Returns the amount of cUsd a user would get for sellAmount of cGLD

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `sellAmount` | BigNumber.Value | The amount of cGLD the user is selling to the exchange |

**Returns:** _Promise‹BigNumber‹››_

The corresponding cUsd amount.

### quoteUsdBuy

▸ **quoteUsdBuy**\(`buyAmount`: BigNumber.Value\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:165_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L165)

Returns the amount of cGLD a user would need to exchange to receive buyAmount of cUsd.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `buyAmount` | BigNumber.Value | The amount of cUsd the user would like to purchase. |

**Returns:** _Promise‹BigNumber‹››_

The corresponding cGLD amount.

### quoteUsdSell

▸ **quoteUsdSell**\(`sellAmount`: BigNumber.Value\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:150_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L150)

Returns the amount of cGLD a user would get for sellAmount of cUsd

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `sellAmount` | BigNumber.Value | The amount of cUsd the user is selling to the exchange |

**Returns:** _Promise‹BigNumber‹››_

The corresponding cGLD amount.

### sellDollar

▸ **sellDollar**\(`amount`: BigNumber.Value, `minGoldAmount`: BigNumber.Value\): [_CeloTransactionObject_]()_‹string›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:142_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L142)

Exchanges amount of cUsd in exchange for at least minGoldAmount of cGLD Requires the amount to have been approved to the exchange

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `amount` | BigNumber.Value | The amount of cUsd the user is selling to the exchange |
| `minGoldAmount` | BigNumber.Value | The minimum amount of cGLD the user has to receive for this transaction to succeed |

**Returns:** [_CeloTransactionObject_]()_‹string›_

### sellGold

▸ **sellGold**\(`amount`: BigNumber.Value, `minUSDAmount`: BigNumber.Value\): [_CeloTransactionObject_]()_‹string›_

_Defined in_ [_contractkit/src/wrappers/Exchange.ts:132_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Exchange.ts#L132)

Exchanges amount of cGLD in exchange for at least minUsdAmount of cUsd Requires the amount to have been approved to the exchange

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `amount` | BigNumber.Value | The amount of cGLD the user is selling to the exchange |
| `minUSDAmount` | BigNumber.Value | - |

**Returns:** [_CeloTransactionObject_]()_‹string›_

