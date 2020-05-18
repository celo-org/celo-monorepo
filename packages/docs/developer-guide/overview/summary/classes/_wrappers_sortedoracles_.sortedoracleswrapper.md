# SortedOraclesWrapper

Currency price oracle contract.

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹SortedOracles›

  ↳ **SortedOraclesWrapper**

## Index

### Constructors

* [constructor](_wrappers_sortedoracles_.sortedoracleswrapper.md#constructor)

### Properties

* [events](_wrappers_sortedoracles_.sortedoracleswrapper.md#events)
* [reportExpirySeconds](_wrappers_sortedoracles_.sortedoracleswrapper.md#reportexpiryseconds)

### Accessors

* [address](_wrappers_sortedoracles_.sortedoracleswrapper.md#address)

### Methods

* [getConfig](_wrappers_sortedoracles_.sortedoracleswrapper.md#getconfig)
* [getOracles](_wrappers_sortedoracles_.sortedoracleswrapper.md#getoracles)
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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | SortedOracles |

**Returns:** [_SortedOraclesWrapper_](_wrappers_sortedoracles_.sortedoracleswrapper.md)

## Properties

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### reportExpirySeconds

• **reportExpirySeconds**: _function_ = proxyCall\( this.contract.methods.reportExpirySeconds, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:102_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L102)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### getConfig

▸ **getConfig**\(\): _Promise‹_[_SortedOraclesConfig_](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)_›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:179_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L179)

Returns current configuration parameters.

**Returns:** _Promise‹_[_SortedOraclesConfig_](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)_›_

### getOracles

▸ **getOracles**\(`token`: [CeloToken](../external-modules/_base_.md#celotoken)\): _Promise‹_[_Address_](../external-modules/_base_.md#address)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L93)

Returns the list of whitelisted oracles for a given token.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `token` | [CeloToken](../external-modules/_base_.md#celotoken) |

**Returns:** _Promise‹_[_Address_](../external-modules/_base_.md#address)_\[\]›_

The list of whitelisted oracles for a given token.

### getRates

▸ **getRates**\(`token`: [CeloToken](../external-modules/_base_.md#celotoken)\): _Promise‹_[_OracleRate_](../interfaces/_wrappers_sortedoracles_.oraclerate.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:197_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L197)

Gets all elements from the doubly linked list.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../external-modules/_base_.md#celotoken) | The CeloToken representing the token for which the Celo   Gold exchange rate is being reported. Example: CeloContract.StableToken |

**Returns:** _Promise‹_[_OracleRate_](../interfaces/_wrappers_sortedoracles_.oraclerate.md)_\[\]›_

An unpacked list of elements from largest to smallest.

### getReports

▸ **getReports**\(`token`: [CeloToken](../external-modules/_base_.md#celotoken)\): _Promise‹_[_OracleReport_](../interfaces/_wrappers_sortedoracles_.oraclereport.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:233_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L233)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `token` | [CeloToken](../external-modules/_base_.md#celotoken) |

**Returns:** _Promise‹_[_OracleReport_](../interfaces/_wrappers_sortedoracles_.oraclereport.md)_\[\]›_

### getStableTokenRates

▸ **getStableTokenRates**\(\): _Promise‹_[_OracleRate_](../interfaces/_wrappers_sortedoracles_.oraclerate.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:189_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L189)

Helper function to get the rates for StableToken, by passing the address of StableToken to `getRates`.

**Returns:** _Promise‹_[_OracleRate_](../interfaces/_wrappers_sortedoracles_.oraclerate.md)_\[\]›_

### getTimestamps

▸ **getTimestamps**\(`token`: [CeloToken](../external-modules/_base_.md#celotoken)\): _Promise‹_[_OracleTimestamp_](../interfaces/_wrappers_sortedoracles_.oracletimestamp.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:218_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L218)

Gets all elements from the doubly linked list.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../external-modules/_base_.md#celotoken) | The CeloToken representing the token for which the Celo   Gold exchange rate is being reported. Example: CeloContract.StableToken |

**Returns:** _Promise‹_[_OracleTimestamp_](../interfaces/_wrappers_sortedoracles_.oracletimestamp.md)_\[\]›_

An unpacked list of elements from largest to smallest.

### isOldestReportExpired

▸ **isOldestReportExpired**\(`token`: [CeloToken](../external-modules/_base_.md#celotoken)\): _Promise‹\[boolean,_ [_Address_](../external-modules/_base_.md#address)_\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:112_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L112)

Checks if the oldest report for a given token is expired

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../external-modules/_base_.md#celotoken) | The token for which to check reports |

**Returns:** _Promise‹\[boolean,_ [_Address_](../external-modules/_base_.md#address)_\]›_

### isOracle

▸ **isOracle**\(`token`: [CeloToken](../external-modules/_base_.md#celotoken), `oracle`: [Address](../external-modules/_base_.md#address)\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:84_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L84)

Checks if the given address is whitelisted as an oracle for the token

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../external-modules/_base_.md#celotoken) | The CeloToken token |
| `oracle` | [Address](../external-modules/_base_.md#address) | The address that we're checking the oracle status of |

**Returns:** _Promise‹boolean›_

boolean describing whether this account is an oracle

### medianRate

▸ **medianRate**\(`token`: [CeloToken](../external-modules/_base_.md#celotoken)\): _Promise‹_[_MedianRate_](../interfaces/_wrappers_sortedoracles_.medianrate.md)_›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L70)

Returns the median rate for the given token

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../external-modules/_base_.md#celotoken) | The CeloToken token for which the Celo Gold exchange rate is being reported. |

**Returns:** _Promise‹_[_MedianRate_](../interfaces/_wrappers_sortedoracles_.medianrate.md)_›_

The median exchange rate for `token`, expressed as: amount of that token / equivalent amount in Celo Gold

### numRates

▸ **numRates**\(`token`: [CeloToken](../external-modules/_base_.md#celotoken)\): _Promise‹number›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L58)

Gets the number of rates that have been reported for the given token

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../external-modules/_base_.md#celotoken) | The CeloToken token for which the Celo Gold exchange rate is being reported. |

**Returns:** _Promise‹number›_

The number of reported oracle rates for `token`.

### removeExpiredReports

▸ **removeExpiredReports**\(`token`: [CeloToken](../external-modules/_base_.md#celotoken), `numReports?`: undefined \| number\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:125_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L125)

Removes expired reports, if any exist

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../external-modules/_base_.md#celotoken) | The token to remove reports for |
| `numReports?` | undefined \| number | The upper-limit of reports to remove. For example, if there are 2 expired reports, and this param is 5, it will only remove the 2 that are expired. |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

### report

▸ **report**\(`token`: [CeloToken](../external-modules/_base_.md#celotoken), `value`: BigNumber.Value, `oracleAddress`: [Address](../external-modules/_base_.md#address)\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:144_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L144)

Updates an oracle value and the median.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../external-modules/_base_.md#celotoken) | The token for which the Celo Gold exchange rate is being reported. |
| `value` | BigNumber.Value | The amount of `token` equal to one Celo Gold. |
| `oracleAddress` | [Address](../external-modules/_base_.md#address) | - |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

### reportStableToken

▸ **reportStableToken**\(`value`: BigNumber.Value, `oracleAddress`: [Address](../external-modules/_base_.md#address)\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:169_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L169)

Updates an oracle value and the median.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `value` | BigNumber.Value | The amount of US Dollars equal to one Celo Gold. |
| `oracleAddress` | [Address](../external-modules/_base_.md#address) | - |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

