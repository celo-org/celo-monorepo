# SortedOraclesWrapper

Currency price oracle contract.

## Hierarchy

* [BaseWrapper]()‹SortedOracles›

  ↳ **SortedOraclesWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [eventTypes]()
* [events]()
* [methodIds]()
* [reportExpirySeconds]()

### Accessors

* [address]()

### Methods

* [getConfig]()
* [getHumanReadableConfig]()
* [getOracles]()
* [getPastEvents]()
* [getRates]()
* [getReports]()
* [getStableTokenRates]()
* [getTimestamps]()
* [getTokenReportExpirySeconds]()
* [isOldestReportExpired]()
* [isOracle]()
* [medianRate]()
* [numRates]()
* [removeExpiredReports]()
* [report]()
* [reportStableToken]()

## Constructors

### constructor

+ **new SortedOraclesWrapper**\(`kit`: [ContractKit](), `contract`: SortedOracles\): [_SortedOraclesWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | SortedOracles |

**Returns:** [_SortedOraclesWrapper_]()

## Properties

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _SortedOracles\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

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

### reportExpirySeconds

• **reportExpirySeconds**: _function_ = proxyCall\( this.contract.methods.reportExpirySeconds, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:106_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L106)

Returns the report expiry parameter.

**`returns`** Current report expiry.

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

### getConfig

▸ **getConfig**\(\): _Promise‹_[_SortedOraclesConfig_]()_›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:194_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L194)

Returns current configuration parameters.

**Returns:** _Promise‹_[_SortedOraclesConfig_]()_›_

### getHumanReadableConfig

▸ **getHumanReadableConfig**\(\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:204_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L204)

**`dev`** Returns human readable configuration of the sortedoracles contract

**Returns:** _Promise‹object›_

SortedOraclesConfig object

### getOracles

▸ **getOracles**\(`target`: [ReportTarget](_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹Address\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:97_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L97)

Returns the list of whitelisted oracles for a given target

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** _Promise‹Address\[\]›_

The list of whitelisted oracles for a given token.

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹SortedOracles›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹SortedOracles› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getRates

▸ **getRates**\(`target`: [ReportTarget](_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹_[_OracleRate_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:222_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L222)

Gets all elements from the doubly linked list.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair in question |

**Returns:** _Promise‹_[_OracleRate_]()_\[\]›_

An unpacked list of elements from largest to smallest.

### getReports

▸ **getReports**\(`target`: [ReportTarget](_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹_[_OracleReport_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:257_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L257)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `target` | [ReportTarget](_wrappers_sortedoracles_.md#reporttarget) |

**Returns:** _Promise‹_[_OracleReport_]()_\[\]›_

### getStableTokenRates

▸ **getStableTokenRates**\(\): _Promise‹_[_OracleRate_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:215_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L215)

Helper function to get the rates for StableToken, by passing the address of StableToken to `getRates`.

**Returns:** _Promise‹_[_OracleRate_]()_\[\]›_

### getTimestamps

▸ **getTimestamps**\(`target`: [ReportTarget](_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹_[_OracleTimestamp_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:242_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L242)

Gets all elements from the doubly linked list.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair in question |

**Returns:** _Promise‹_[_OracleTimestamp_]()_\[\]›_

An unpacked list of elements from largest to smallest.

### getTokenReportExpirySeconds

▸ **getTokenReportExpirySeconds**\(`target`: [ReportTarget](_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L117)

Returns the expiry for the target if exists, if not the default.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** _Promise‹BigNumber›_

The report expiry in seconds.

### isOldestReportExpired

▸ **isOldestReportExpired**\(`target`: [ReportTarget](_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹\[boolean, Address\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:127_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L127)

Checks if the oldest report for a given target is expired

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** _Promise‹\[boolean, Address\]›_

### isOracle

▸ **isOracle**\(`target`: [ReportTarget](_wrappers_sortedoracles_.md#reporttarget), `oracle`: Address\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:87_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L87)

Checks if the given address is whitelisted as an oracle for the target

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |
| `oracle` | Address | The address that we're checking the oracle status of |

**Returns:** _Promise‹boolean›_

boolean describing whether this account is an oracle

### medianRate

▸ **medianRate**\(`target`: [ReportTarget](_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹_[_MedianRate_]()_›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:73_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L73)

Returns the median rate for the given target

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** _Promise‹_[_MedianRate_]()_›_

The median exchange rate for `token`, expressed as: amount of that token / equivalent amount in CELO

### numRates

▸ **numRates**\(`target`: [ReportTarget](_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹number›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L61)

Gets the number of rates that have been reported for the given target

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** _Promise‹number›_

The number of reported oracle rates for `token`.

### removeExpiredReports

▸ **removeExpiredReports**\(`target`: [ReportTarget](_wrappers_sortedoracles_.md#reporttarget), `numReports?`: undefined \| number\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:140_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L140)

Removes expired reports, if any exist

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |
| `numReports?` | undefined \| number | The upper-limit of reports to remove. For example, if there are 2 expired reports, and this param is 5, it will only remove the 2 that are expired. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

### report

▸ **report**\(`target`: [ReportTarget](_wrappers_sortedoracles_.md#reporttarget), `value`: BigNumber.Value, `oracleAddress`: Address\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:159_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L159)

Updates an oracle value and the median.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |
| `value` | BigNumber.Value | The amount of `token` equal to one CELO. |
| `oracleAddress` | Address | - |

**Returns:** _Promise‹CeloTransactionObject‹void››_

### reportStableToken

▸ **reportStableToken**\(`value`: BigNumber.Value, `oracleAddress`: Address\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:184_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L184)

Updates an oracle value and the median.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `value` | BigNumber.Value | The amount of US Dollars equal to one CELO. |
| `oracleAddress` | Address | - |

**Returns:** _Promise‹CeloTransactionObject‹void››_

