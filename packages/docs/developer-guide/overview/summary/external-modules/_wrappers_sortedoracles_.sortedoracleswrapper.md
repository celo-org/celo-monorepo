# SortedOraclesWrapper

Currency price oracle contract.

## Hierarchy

* [BaseWrapper]()‹SortedOracles›

  ↳ **SortedOraclesWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [events]()
* [reportExpirySeconds]()

### Accessors

* [address]()

### Methods

* [getConfig]()
* [getOracles]()
* [getRates]()
* [getReports]()
* [getStableTokenRates]()
* [getTimestamps]()
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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | SortedOracles |

**Returns:** [_SortedOraclesWrapper_]()

## Properties

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

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

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### getConfig

▸ **getConfig**\(\): _Promise‹_[_SortedOraclesConfig_]()_›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:179_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L179)

Returns current configuration parameters.

**Returns:** _Promise‹_[_SortedOraclesConfig_]()_›_

### getOracles

▸ **getOracles**\(`token`: [CeloToken](_base_.md#celotoken)\): _Promise‹_[_Address_](_base_.md#address)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L93)

Returns the list of whitelisted oracles for a given token.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `token` | [CeloToken](_base_.md#celotoken) |

**Returns:** _Promise‹_[_Address_](_base_.md#address)_\[\]›_

The list of whitelisted oracles for a given token.

### getRates

▸ **getRates**\(`token`: [CeloToken](_base_.md#celotoken)\): _Promise‹_[_OracleRate_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:197_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L197)

Gets all elements from the doubly linked list.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](_base_.md#celotoken) | The CeloToken representing the token for which the Celo   Gold exchange rate is being reported. Example: CeloContract.StableToken |

**Returns:** _Promise‹_[_OracleRate_]()_\[\]›_

An unpacked list of elements from largest to smallest.

### getReports

▸ **getReports**\(`token`: [CeloToken](_base_.md#celotoken)\): _Promise‹_[_OracleReport_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:233_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L233)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `token` | [CeloToken](_base_.md#celotoken) |

**Returns:** _Promise‹_[_OracleReport_]()_\[\]›_

### getStableTokenRates

▸ **getStableTokenRates**\(\): _Promise‹_[_OracleRate_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:189_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L189)

Helper function to get the rates for StableToken, by passing the address of StableToken to `getRates`.

**Returns:** _Promise‹_[_OracleRate_]()_\[\]›_

### getTimestamps

▸ **getTimestamps**\(`token`: [CeloToken](_base_.md#celotoken)\): _Promise‹_[_OracleTimestamp_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:218_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L218)

Gets all elements from the doubly linked list.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](_base_.md#celotoken) | The CeloToken representing the token for which the Celo   Gold exchange rate is being reported. Example: CeloContract.StableToken |

**Returns:** _Promise‹_[_OracleTimestamp_]()_\[\]›_

An unpacked list of elements from largest to smallest.

### isOldestReportExpired

▸ **isOldestReportExpired**\(`token`: [CeloToken](_base_.md#celotoken)\): _Promise‹\[boolean,_ [_Address_](_base_.md#address)_\]›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:112_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L112)

Checks if the oldest report for a given token is expired

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](_base_.md#celotoken) | The token for which to check reports |

**Returns:** _Promise‹\[boolean,_ [_Address_](_base_.md#address)_\]›_

### isOracle

▸ **isOracle**\(`token`: [CeloToken](_base_.md#celotoken), `oracle`: [Address](_base_.md#address)\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:84_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L84)

Checks if the given address is whitelisted as an oracle for the token

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](_base_.md#celotoken) | The CeloToken token |
| `oracle` | [Address](_base_.md#address) | The address that we're checking the oracle status of |

**Returns:** _Promise‹boolean›_

boolean describing whether this account is an oracle

### medianRate

▸ **medianRate**\(`token`: [CeloToken](_base_.md#celotoken)\): _Promise‹_[_MedianRate_]()_›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L70)

Returns the median rate for the given token

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](_base_.md#celotoken) | The CeloToken token for which the Celo Gold exchange rate is being reported. |

**Returns:** _Promise‹_[_MedianRate_]()_›_

The median exchange rate for `token`, expressed as: amount of that token / equivalent amount in Celo Gold

### numRates

▸ **numRates**\(`token`: [CeloToken](_base_.md#celotoken)\): _Promise‹number›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L58)

Gets the number of rates that have been reported for the given token

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](_base_.md#celotoken) | The CeloToken token for which the Celo Gold exchange rate is being reported. |

**Returns:** _Promise‹number›_

The number of reported oracle rates for `token`.

### removeExpiredReports

▸ **removeExpiredReports**\(`token`: [CeloToken](_base_.md#celotoken), `numReports?`: undefined \| number\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:125_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L125)

Removes expired reports, if any exist

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](_base_.md#celotoken) | The token to remove reports for |
| `numReports?` | undefined \| number | The upper-limit of reports to remove. For example, if there are 2 expired reports, and this param is 5, it will only remove the 2 that are expired. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

### report

▸ **report**\(`token`: [CeloToken](_base_.md#celotoken), `value`: BigNumber.Value, `oracleAddress`: [Address](_base_.md#address)\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:144_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L144)

Updates an oracle value and the median.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](_base_.md#celotoken) | The token for which the Celo Gold exchange rate is being reported. |
| `value` | BigNumber.Value | The amount of `token` equal to one Celo Gold. |
| `oracleAddress` | [Address](_base_.md#address) | - |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

### reportStableToken

▸ **reportStableToken**\(`value`: BigNumber.Value, `oracleAddress`: [Address](_base_.md#address)\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:169_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L169)

Updates an oracle value and the median.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `value` | BigNumber.Value | The amount of US Dollars equal to one Celo Gold. |
| `oracleAddress` | [Address](_base_.md#address) | - |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

