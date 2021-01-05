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

*Defined in [contractkit/src/wrappers/SortedOracles.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L102)*

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

*Defined in [contractkit/src/wrappers/SortedOracles.ts:190](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L190)*

Returns current configuration parameters.

**Returns:** *Promise‹[SortedOraclesConfig](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)›*

___

###  getHumanReadableConfig

▸ **getHumanReadableConfig**(): *Promise‹object›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:200](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L200)*

**`dev`** Returns human readable configuration of the sortedoracles contract

**Returns:** *Promise‹object›*

SortedOraclesConfig object

___

###  getOracles

▸ **getOracles**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹Address[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L93)*

Returns the list of whitelisted oracles for a given token.

**Parameters:**

Name | Type |
------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) |

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

▸ **getRates**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:219](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L219)*

Gets all elements from the doubly linked list.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken representing the token for which the Celo   Gold exchange rate is being reported. Example: CeloContract.StableToken |

**Returns:** *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

An unpacked list of elements from largest to smallest.

___

###  getReports

▸ **getReports**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹[OracleReport](../interfaces/_wrappers_sortedoracles_.oraclereport.md)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:255](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L255)*

**Parameters:**

Name | Type |
------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) |

**Returns:** *Promise‹[OracleReport](../interfaces/_wrappers_sortedoracles_.oraclereport.md)[]›*

___

###  getStableTokenRates

▸ **getStableTokenRates**(): *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:211](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L211)*

Helper function to get the rates for StableToken, by passing the address
of StableToken to `getRates`.

**Returns:** *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

___

###  getTimestamps

▸ **getTimestamps**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹[OracleTimestamp](../interfaces/_wrappers_sortedoracles_.oracletimestamp.md)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:240](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L240)*

Gets all elements from the doubly linked list.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken representing the token for which the Celo   Gold exchange rate is being reported. Example: CeloContract.StableToken |

**Returns:** *Promise‹[OracleTimestamp](../interfaces/_wrappers_sortedoracles_.oracletimestamp.md)[]›*

An unpacked list of elements from largest to smallest.

___

###  getTokenReportExpirySeconds

▸ **getTokenReportExpirySeconds**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹BigNumber›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:113](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L113)*

Returns the expiry for the token if exists, if not the default.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The address of the token. |

**Returns:** *Promise‹BigNumber›*

The report expiry in seconds.

___

###  isOldestReportExpired

▸ **isOldestReportExpired**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹[boolean, Address]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L123)*

Checks if the oldest report for a given token is expired

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The token for which to check reports  |

**Returns:** *Promise‹[boolean, Address]›*

___

###  isOracle

▸ **isOracle**(`token`: [CeloToken](../modules/_base_.md#celotoken), `oracle`: Address): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L84)*

Checks if the given address is whitelisted as an oracle for the token

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken token |
`oracle` | Address | The address that we're checking the oracle status of |

**Returns:** *Promise‹boolean›*

boolean describing whether this account is an oracle

___

###  medianRate

▸ **medianRate**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹[MedianRate](../interfaces/_wrappers_sortedoracles_.medianrate.md)›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L70)*

Returns the median rate for the given token

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken token for which the CELO exchange rate is being reported. |

**Returns:** *Promise‹[MedianRate](../interfaces/_wrappers_sortedoracles_.medianrate.md)›*

The median exchange rate for `token`, expressed as:
  amount of that token / equivalent amount in CELO

___

###  numRates

▸ **numRates**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹number›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L58)*

Gets the number of rates that have been reported for the given token

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken token for which the CELO exchange rate is being reported. |

**Returns:** *Promise‹number›*

The number of reported oracle rates for `token`.

___

###  removeExpiredReports

▸ **removeExpiredReports**(`token`: [CeloToken](../modules/_base_.md#celotoken), `numReports?`: undefined | number): *Promise‹CeloTransactionObject‹void››*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:136](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L136)*

Removes expired reports, if any exist

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The token to remove reports for |
`numReports?` | undefined &#124; number | The upper-limit of reports to remove. For example, if there are 2 expired reports, and this param is 5, it will only remove the 2 that are expired.  |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  report

▸ **report**(`token`: [CeloToken](../modules/_base_.md#celotoken), `value`: BigNumber.Value, `oracleAddress`: Address): *Promise‹CeloTransactionObject‹void››*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:155](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L155)*

Updates an oracle value and the median.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The token for which the CELO exchange rate is being reported. |
`value` | BigNumber.Value | The amount of `token` equal to one CELO.  |
`oracleAddress` | Address | - |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  reportStableToken

▸ **reportStableToken**(`value`: BigNumber.Value, `oracleAddress`: Address): *Promise‹CeloTransactionObject‹void››*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:180](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L180)*

Updates an oracle value and the median.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`value` | BigNumber.Value | The amount of US Dollars equal to one CELO.  |
`oracleAddress` | Address | - |

**Returns:** *Promise‹CeloTransactionObject‹void››*
