# Class: SortedOraclesWrapper

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

###  constructor

\+ **new SortedOraclesWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: SortedOracles): *[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | SortedOracles |

**Returns:** *[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)*

## Properties

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

___

###  events

• **events**: *SortedOracles["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)*

___

###  methodIds

• **methodIds**: *Record‹keyof T["methods"], string›* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined
          ? '0x'
          : this.kit.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)*

___

###  reportExpirySeconds

• **reportExpirySeconds**: *function* = proxyCall(
    this.contract.methods.reportExpirySeconds,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/SortedOracles.ts:146](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L146)*

Returns the report expiry parameter.

**`returns`** Current report expiry.

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

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)*

Contract address

**Returns:** *string*

## Methods

###  getConfig

▸ **getConfig**(): *Promise‹[SortedOraclesConfig](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:234](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L234)*

Returns current configuration parameters.

**Returns:** *Promise‹[SortedOraclesConfig](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)›*

___

###  getHumanReadableConfig

▸ **getHumanReadableConfig**(): *Promise‹object›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:244](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L244)*

**`dev`** Returns human readable configuration of the sortedoracles contract

**Returns:** *Promise‹object›*

SortedOraclesConfig object

___

###  getOracles

▸ **getOracles**(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)): *Promise‹Address[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:137](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L137)*

Returns the list of whitelisted oracles for a given target

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** *Promise‹Address[]›*

The list of whitelisted oracles for a given token.

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹SortedOracles›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹SortedOracles› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getRates

▸ **getRates**(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)): *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:262](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L262)*

Gets all elements from the doubly linked list.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair in question |

**Returns:** *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

An unpacked list of elements from largest to smallest.

___

###  getReports

▸ **getReports**(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)): *Promise‹[OracleReport](../interfaces/_wrappers_sortedoracles_.oraclereport.md)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:297](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L297)*

**Parameters:**

Name | Type |
------ | ------ |
`target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) |

**Returns:** *Promise‹[OracleReport](../interfaces/_wrappers_sortedoracles_.oraclereport.md)[]›*

___

###  getStableTokenRates

▸ **getStableTokenRates**(): *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:255](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L255)*

Helper function to get the rates for StableToken, by passing the address
of StableToken to `getRates`.

**Returns:** *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

___

###  getTimestamps

▸ **getTimestamps**(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)): *Promise‹[OracleTimestamp](../interfaces/_wrappers_sortedoracles_.oracletimestamp.md)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:282](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L282)*

Gets all elements from the doubly linked list.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair in question |

**Returns:** *Promise‹[OracleTimestamp](../interfaces/_wrappers_sortedoracles_.oracletimestamp.md)[]›*

An unpacked list of elements from largest to smallest.

___

###  getTokenReportExpirySeconds

▸ **getTokenReportExpirySeconds**(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)): *Promise‹BigNumber›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:157](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L157)*

Returns the expiry for the target if exists, if not the default.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** *Promise‹BigNumber›*

The report expiry in seconds.

___

###  isOldestReportExpired

▸ **isOldestReportExpired**(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)): *Promise‹[boolean, Address]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:167](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L167)*

Checks if the oldest report for a given target is expired

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair  |

**Returns:** *Promise‹[boolean, Address]›*

___

###  isOracle

▸ **isOracle**(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget), `oracle`: Address): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:127](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L127)*

Checks if the given address is whitelisted as an oracle for the target

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |
`oracle` | Address | The address that we're checking the oracle status of |

**Returns:** *Promise‹boolean›*

boolean describing whether this account is an oracle

___

###  medianRate

▸ **medianRate**(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)): *Promise‹[MedianRate](../interfaces/_wrappers_sortedoracles_.medianrate.md)›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:113](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L113)*

Returns the median rate for the given target

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** *Promise‹[MedianRate](../interfaces/_wrappers_sortedoracles_.medianrate.md)›*

The median exchange rate for `token`, expressed as:
  amount of that token / equivalent amount in CELO

___

###  numRates

▸ **numRates**(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget)): *Promise‹number›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L101)*

Gets the number of rates that have been reported for the given target

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |

**Returns:** *Promise‹number›*

The number of reported oracle rates for `token`.

___

###  removeExpiredReports

▸ **removeExpiredReports**(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget), `numReports?`: undefined | number): *Promise‹CeloTransactionObject‹void››*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:180](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L180)*

Removes expired reports, if any exist

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |
`numReports?` | undefined &#124; number | The upper-limit of reports to remove. For example, if there are 2 expired reports, and this param is 5, it will only remove the 2 that are expired.  |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  report

▸ **report**(`target`: [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget), `value`: BigNumber.Value, `oracleAddress`: Address): *Promise‹CeloTransactionObject‹void››*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:199](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L199)*

Updates an oracle value and the median.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`target` | [ReportTarget](../modules/_wrappers_sortedoracles_.md#reporttarget) | The ReportTarget, either CeloToken or currency pair |
`value` | BigNumber.Value | The amount of `token` equal to one CELO.  |
`oracleAddress` | Address | - |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  reportStableToken

▸ **reportStableToken**(`value`: BigNumber.Value, `oracleAddress`: Address): *Promise‹CeloTransactionObject‹void››*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:224](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L224)*

Updates an oracle value and the median.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`value` | BigNumber.Value | The amount of US Dollars equal to one CELO.  |
`oracleAddress` | Address | - |

**Returns:** *Promise‹CeloTransactionObject‹void››*
