# SortedOraclesWrapper

Currency price oracle contract.

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹SortedOracles›

  ↳ **SortedOraclesWrapper**

## Index

### Constructors

* [constructor](_wrappers_sortedoracles_.sortedoracleswrapper.md#constructor)

### Properties

* [eventTypes](_wrappers_sortedoracles_.sortedoracleswrapper.md#eventtypes)
* [events](_wrappers_sortedoracles_.sortedoracleswrapper.md#events)
* [methodIds](_wrappers_sortedoracles_.sortedoracleswrapper.md#methodids)
* [reportExpirySeconds](_wrappers_sortedoracles_.sortedoracleswrapper.md#reportexpiryseconds)

### Accessors

* [address](_wrappers_sortedoracles_.sortedoracleswrapper.md#address)

### Methods

* [getConfig](_wrappers_sortedoracles_.sortedoracleswrapper.md#getconfig)
* [getHumanReadableConfig](_wrappers_sortedoracles_.sortedoracleswrapper.md#gethumanreadableconfig)
* [getOracles](_wrappers_sortedoracles_.sortedoracleswrapper.md#getoracles)
* [getPastEvents](_wrappers_sortedoracles_.sortedoracleswrapper.md#getpastevents)
* [getRates](_wrappers_sortedoracles_.sortedoracleswrapper.md#getrates)
* [getReports](_wrappers_sortedoracles_.sortedoracleswrapper.md#getreports)
* [getStableTokenRates](_wrappers_sortedoracles_.sortedoracleswrapper.md#getstabletokenrates)
* [getTimestamps](_wrappers_sortedoracles_.sortedoracleswrapper.md#gettimestamps)
* [getTokenReportExpirySeconds](_wrappers_sortedoracles_.sortedoracleswrapper.md#gettokenreportexpiryseconds)
* [isOldestReportExpired](_wrappers_sortedoracles_.sortedoracleswrapper.md#isoldestreportexpired)
* [isOracle](_wrappers_sortedoracles_.sortedoracleswrapper.md#isoracle)
* [medianRate](_wrappers_sortedoracles_.sortedoracleswrapper.md#medianrate)
* [numRates](_wrappers_sortedoracles_.sortedoracleswrapper.md#numrates)
* [removeExpiredReports](_wrappers_sortedoracles_.sortedoracleswrapper.md#removeexpiredreports)
* [report](_wrappers_sortedoracles_.sortedoracleswrapper.md#report)
* [reportStableToken](_wrappers_sortedoracles_.sortedoracleswrapper.md#reportstabletoken)

## Constructors

### constructor

+ **new SortedOraclesWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: SortedOracles\): [_SortedOraclesWrapper_](_wrappers_sortedoracles_.sortedoracleswrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | SortedOracles |

**Returns:** [_SortedOraclesWrapper_](_wrappers_sortedoracles_.sortedoracleswrapper.md)

## Properties

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_eventTypes_](_wrappers_basewrapper_.basewrapper.md#eventtypes)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _SortedOracles\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

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

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_methodIds_](_wrappers_basewrapper_.basewrapper.md#methodids)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)

### reportExpirySeconds

• **reportExpirySeconds**: _function_ = proxyCall\( this.contract.methods.reportExpirySeconds, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:146_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L146)

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

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getConfig

▸ **getConfig**\(\): _Promise‹_[_SortedOraclesConfig_](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)_›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:234_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L234)

Returns current configuration parameters.

**Returns:** _Promise‹_[_SortedOraclesConfig_](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)_›_

### getHumanReadableConfig

▸ **getHumanReadableConfig**\(\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:244_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L244)

**`dev`** Returns human readable configuration of the sortedoracles contract

**Returns:** _Promise‹object›_

SortedOraclesConfig object

### getOracles

▸ **getOracles**\(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹Address\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:137_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L137)

Returns the list of whitelisted oracles for a given target

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** _Promise‹Address\[\]›_

The list of whitelisted oracles for a given token.

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹SortedOracles›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_getPastEvents_](_wrappers_basewrapper_.basewrapper.md#getpastevents)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹SortedOracles› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getRates

▸ **getRates**\(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹_[_OracleRate_](../interfaces/_wrappers_sortedoracles_.oraclerate.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:262_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L262)

Gets all elements from the doubly linked list.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair in question |

**Returns:** _Promise‹_[_OracleRate_](../interfaces/_wrappers_sortedoracles_.oraclerate.md)_\[\]›_

An unpacked list of elements from largest to smallest.

### getReports

▸ **getReports**\(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹_[_OracleReport_](../interfaces/_wrappers_sortedoracles_.oraclereport.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:297_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L297)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) |

**Returns:** _Promise‹_[_OracleReport_](../interfaces/_wrappers_sortedoracles_.oraclereport.md)_\[\]›_

### getStableTokenRates

▸ **getStableTokenRates**\(\): _Promise‹_[_OracleRate_](../interfaces/_wrappers_sortedoracles_.oraclerate.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:255_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L255)

Helper function to get the rates for StableToken, by passing the address of StableToken to `getRates`.

**Returns:** _Promise‹_[_OracleRate_](../interfaces/_wrappers_sortedoracles_.oraclerate.md)_\[\]›_

### getTimestamps

▸ **getTimestamps**\(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹_[_OracleTimestamp_](../interfaces/_wrappers_sortedoracles_.oracletimestamp.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:282_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L282)

Gets all elements from the doubly linked list.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair in question |

**Returns:** _Promise‹_[_OracleTimestamp_](../interfaces/_wrappers_sortedoracles_.oracletimestamp.md)_\[\]›_

An unpacked list of elements from largest to smallest.

### getTokenReportExpirySeconds

▸ **getTokenReportExpirySeconds**\(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L157)

Returns the expiry for the target if exists, if not the default.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** _Promise‹BigNumber›_

The report expiry in seconds.

### isOldestReportExpired

▸ **isOldestReportExpired**\(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹\[boolean, Address\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:167_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L167)

Checks if the oldest report for a given target is expired

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** _Promise‹\[boolean, Address\]›_

### isOracle

▸ **isOracle**\(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget), `oracle`: Address\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:127_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L127)

Checks if the given address is whitelisted as an oracle for the target

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |
| `oracle` | Address | The address that we're checking the oracle status of |

**Returns:** _Promise‹boolean›_

boolean describing whether this account is an oracle

### medianRate

▸ **medianRate**\(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹_[_MedianRate_](../interfaces/_wrappers_sortedoracles_.medianrate.md)_›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:113_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L113)

Returns the median rate for the given target

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** _Promise‹_[_MedianRate_](../interfaces/_wrappers_sortedoracles_.medianrate.md)_›_

The median exchange rate for `token`, expressed as: amount of that token / equivalent amount in CELO

### numRates

▸ **numRates**\(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)\): _Promise‹number›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:101_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L101)

Gets the number of rates that have been reported for the given target

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** _Promise‹number›_

The number of reported oracle rates for `token`.

### removeExpiredReports

▸ **removeExpiredReports**\(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget), `numReports?`: undefined \| number\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:180_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L180)

Removes expired reports, if any exist

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |
| `numReports?` | undefined \| number | The upper-limit of reports to remove. For example, if there are 2 expired reports, and this param is 5, it will only remove the 2 that are expired. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

### report

▸ **report**\(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget), `value`: BigNumber.Value, `oracleAddress`: Address\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:199_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L199)

Updates an oracle value and the median.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |
| `value` | BigNumber.Value | The amount of `token` equal to one CELO. |
| `oracleAddress` | Address | - |

**Returns:** _Promise‹CeloTransactionObject‹void››_

### reportStableToken

▸ **reportStableToken**\(`value`: BigNumber.Value, `oracleAddress`: Address\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:224_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L224)

Updates an oracle value and the median.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `value` | BigNumber.Value | The amount of US Dollars equal to one CELO. |
| `oracleAddress` | Address | - |

**Returns:** _Promise‹CeloTransactionObject‹void››_

