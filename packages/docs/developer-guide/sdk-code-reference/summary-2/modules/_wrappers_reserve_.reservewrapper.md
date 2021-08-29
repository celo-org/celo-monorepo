# ReserveWrapper

Contract for handling reserve for stable currencies

## Hierarchy

* [BaseWrapper]()‹Reserve›

  ↳ **ReserveWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [dailySpendingRatio]()
* [eventTypes]()
* [events]()
* [frozenReserveGoldDays]()
* [frozenReserveGoldStartBalance]()
* [frozenReserveGoldStartDay]()
* [getOrComputeTobinTax]()
* [getOtherReserveAddresses]()
* [getReserveGoldBalance]()
* [isOtherReserveAddress]()
* [isSpender]()
* [methodIds]()
* [tobinTaxStalenessThreshold]()
* [transferGold]()

### Accessors

* [address]()

### Methods

* [getConfig]()
* [getPastEvents]()
* [getSpenders]()

## Constructors

### constructor

+ **new ReserveWrapper**\(`kit`: [ContractKit](), `contract`: Reserve\): [_ReserveWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Reserve |

**Returns:** [_ReserveWrapper_]()

## Properties

### dailySpendingRatio

• **dailySpendingRatio**: _function_ = proxyCall\( this.contract.methods.getDailySpendingRatio, undefined, fixidityValueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Reserve.ts#L33)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _Reserve\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### frozenReserveGoldDays

• **frozenReserveGoldDays**: _function_ = proxyCall\( this.contract.methods.frozenReserveGoldDays, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Reserve.ts#L51)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### frozenReserveGoldStartBalance

• **frozenReserveGoldStartBalance**: _function_ = proxyCall\( this.contract.methods.frozenReserveGoldStartBalance, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Reserve.ts#L41)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### frozenReserveGoldStartDay

• **frozenReserveGoldStartDay**: _function_ = proxyCall\( this.contract.methods.frozenReserveGoldStartDay, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Reserve.ts#L46)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getOrComputeTobinTax

• **getOrComputeTobinTax**: _function_ = proxySend\(this.kit, this.contract.methods.getOrComputeTobinTax\)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Reserve.ts#L40)

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getOtherReserveAddresses

• **getOtherReserveAddresses**: _function_ = proxyCall\(this.contract.methods.getOtherReserveAddresses\)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Reserve.ts#L61)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getReserveGoldBalance

• **getReserveGoldBalance**: _function_ = proxyCall\( this.contract.methods.getReserveGoldBalance, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Reserve.ts#L56)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isOtherReserveAddress

• **isOtherReserveAddress**: _function_ = proxyCall\(this.contract.methods.isOtherReserveAddress\)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:76_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Reserve.ts#L76)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isSpender

• **isSpender**: _function_ = proxyCall\(this.contract.methods.isSpender\)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Reserve.ts#L38)

#### Type declaration:

▸ \(`account`: string\): _Promise‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

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

### tobinTaxStalenessThreshold

• **tobinTaxStalenessThreshold**: _function_ = proxyCall\( this.contract.methods.tobinTaxStalenessThreshold, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Reserve.ts#L28)

Query Tobin tax staleness threshold parameter.

**`returns`** Current Tobin tax staleness threshold.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### transferGold

• **transferGold**: _function_ = proxySend\(this.kit, this.contract.methods.transferGold\)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Reserve.ts#L39)

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

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

### getConfig

▸ **getConfig**\(\): _Promise‹_[_ReserveConfig_]()_›_

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:66_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Reserve.ts#L66)

Returns current configuration parameters.

**Returns:** _Promise‹_[_ReserveConfig_]()_›_

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Reserve›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Reserve› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getSpenders

▸ **getSpenders**\(\): _Promise‹Address\[\]›_

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:78_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Reserve.ts#L78)

**Returns:** _Promise‹Address\[\]›_

