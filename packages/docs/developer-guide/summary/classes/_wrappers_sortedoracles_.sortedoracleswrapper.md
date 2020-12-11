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

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)

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

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)

### events

• **events**: _SortedOracles\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)

### methodIds

• **methodIds**: _Record‹keyof T\["methods"\], string›_ = Object.keys\(this.contract.methods\).reduce, string&gt;&gt;\( \(acc, method: Methods\) =&gt; { const methodABI = this.contract.options.jsonInterface.find\(\(item\) =&gt; item.name === method\)

```text
  acc[method] =
    methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_methodIds_](_wrappers_basewrapper_.basewrapper.md#methodids)

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)

### reportExpirySeconds

• **reportExpirySeconds**: _function_ = proxyCall\( this.contract.methods.reportExpirySeconds, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:103_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L103)

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

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getConfig

▸ **getConfig**\(\): _Promise‹_[_SortedOraclesConfig_](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)_›_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:180_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L180)

Returns current configuration parameters.

**Returns:** _Promise‹_[_SortedOraclesConfig_](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)_›_

### getHumanReadableConfig

▸ **getHumanReadableConfig**\(\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:190_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L190)

**`dev`** Returns human readable configuration of the sortedoracles contract

**Returns:** _Promise‹object›_

SortedOraclesConfig object

### getOracles

▸ **getOracles**\(`token`: [CeloToken](../modules/_base_.md#celotoken)\): _Promise‹_[_Address_](../modules/_base_.md#address)_\[\]›_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:94_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L94)

Returns the list of whitelisted oracles for a given token.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `token` | [CeloToken](../modules/_base_.md#celotoken) |

**Returns:** _Promise‹_[_Address_](../modules/_base_.md#address)_\[\]›_

The list of whitelisted oracles for a given token.

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹SortedOracles›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_getPastEvents_](_wrappers_basewrapper_.basewrapper.md#getpastevents)

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹SortedOracles› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getRates

▸ **getRates**\(`token`: [CeloToken](../modules/_base_.md#celotoken)\): _Promise‹_[_OracleRate_](../interfaces/_wrappers_sortedoracles_.oraclerate.md)_\[\]›_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:209_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L209)

Gets all elements from the doubly linked list.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken representing the token for which the Celo   Gold exchange rate is being reported. Example: CeloContract.StableToken |

**Returns:** _Promise‹_[_OracleRate_](../interfaces/_wrappers_sortedoracles_.oraclerate.md)_\[\]›_

An unpacked list of elements from largest to smallest.

### getReports

▸ **getReports**\(`token`: [CeloToken](../modules/_base_.md#celotoken)\): _Promise‹_[_OracleReport_](../interfaces/_wrappers_sortedoracles_.oraclereport.md)_\[\]›_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:245_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L245)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `token` | [CeloToken](../modules/_base_.md#celotoken) |

**Returns:** _Promise‹_[_OracleReport_](../interfaces/_wrappers_sortedoracles_.oraclereport.md)_\[\]›_

### getStableTokenRates

▸ **getStableTokenRates**\(\): _Promise‹_[_OracleRate_](../interfaces/_wrappers_sortedoracles_.oraclerate.md)_\[\]›_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:201_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L201)

Helper function to get the rates for StableToken, by passing the address of StableToken to `getRates`.

**Returns:** _Promise‹_[_OracleRate_](../interfaces/_wrappers_sortedoracles_.oraclerate.md)_\[\]›_

### getTimestamps

▸ **getTimestamps**\(`token`: [CeloToken](../modules/_base_.md#celotoken)\): _Promise‹_[_OracleTimestamp_](../interfaces/_wrappers_sortedoracles_.oracletimestamp.md)_\[\]›_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:230_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L230)

Gets all elements from the doubly linked list.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken representing the token for which the Celo   Gold exchange rate is being reported. Example: CeloContract.StableToken |

**Returns:** _Promise‹_[_OracleTimestamp_](../interfaces/_wrappers_sortedoracles_.oracletimestamp.md)_\[\]›_

An unpacked list of elements from largest to smallest.

### isOldestReportExpired

▸ **isOldestReportExpired**\(`token`: [CeloToken](../modules/_base_.md#celotoken)\): _Promise‹\[boolean,_ [_Address_](../modules/_base_.md#address)_\]›_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:113_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L113)

Checks if the oldest report for a given token is expired

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../modules/_base_.md#celotoken) | The token for which to check reports |

**Returns:** _Promise‹\[boolean,_ [_Address_](../modules/_base_.md#address)_\]›_

### isOracle

▸ **isOracle**\(`token`: [CeloToken](../modules/_base_.md#celotoken), `oracle`: [Address](../modules/_base_.md#address)\): _Promise‹boolean›_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:85_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L85)

Checks if the given address is whitelisted as an oracle for the token

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken token |
| `oracle` | [Address](../modules/_base_.md#address) | The address that we're checking the oracle status of |

**Returns:** _Promise‹boolean›_

boolean describing whether this account is an oracle

### medianRate

▸ **medianRate**\(`token`: [CeloToken](../modules/_base_.md#celotoken)\): _Promise‹_[_MedianRate_](../interfaces/_wrappers_sortedoracles_.medianrate.md)_›_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L71)

Returns the median rate for the given token

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken token for which the CELO exchange rate is being reported. |

**Returns:** _Promise‹_[_MedianRate_](../interfaces/_wrappers_sortedoracles_.medianrate.md)_›_

The median exchange rate for `token`, expressed as: amount of that token / equivalent amount in CELO

### numRates

▸ **numRates**\(`token`: [CeloToken](../modules/_base_.md#celotoken)\): _Promise‹number›_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L59)

Gets the number of rates that have been reported for the given token

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken token for which the CELO exchange rate is being reported. |

**Returns:** _Promise‹number›_

The number of reported oracle rates for `token`.

### removeExpiredReports

▸ **removeExpiredReports**\(`token`: [CeloToken](../modules/_base_.md#celotoken), `numReports?`: undefined \| number\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:126_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L126)

Removes expired reports, if any exist

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../modules/_base_.md#celotoken) | The token to remove reports for |
| `numReports?` | undefined \| number | The upper-limit of reports to remove. For example, if there are 2 expired reports, and this param is 5, it will only remove the 2 that are expired. |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

### report

▸ **report**\(`token`: [CeloToken](../modules/_base_.md#celotoken), `value`: BigNumber.Value, `oracleAddress`: [Address](../modules/_base_.md#address)\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:145_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L145)

Updates an oracle value and the median.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../modules/_base_.md#celotoken) | The token for which the CELO exchange rate is being reported. |
| `value` | BigNumber.Value | The amount of `token` equal to one CELO. |
| `oracleAddress` | [Address](../modules/_base_.md#address) | - |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

### reportStableToken

▸ **reportStableToken**\(`value`: BigNumber.Value, `oracleAddress`: [Address](../modules/_base_.md#address)\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/SortedOracles.ts:170_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L170)

Updates an oracle value and the median.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `value` | BigNumber.Value | The amount of US Dollars equal to one CELO. |
| `oracleAddress` | [Address](../modules/_base_.md#address) | - |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

