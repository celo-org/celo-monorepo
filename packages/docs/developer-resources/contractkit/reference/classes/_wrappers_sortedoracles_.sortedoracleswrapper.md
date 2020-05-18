# Class: SortedOraclesWrapper

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

###  constructor

\+ **new SortedOraclesWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: SortedOracles): *[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | SortedOracles |

**Returns:** *[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)*

## Properties

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  reportExpirySeconds

• **reportExpirySeconds**: *function* = proxyCall(
    this.contract.methods.reportExpirySeconds,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/SortedOracles.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L102)*

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

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  getConfig

▸ **getConfig**(): *Promise‹[SortedOraclesConfig](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:179](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L179)*

Returns current configuration parameters.

**Returns:** *Promise‹[SortedOraclesConfig](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)›*

___

###  getOracles

▸ **getOracles**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹[Address](../modules/_base_.md#address)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L93)*

Returns the list of whitelisted oracles for a given token.

**Parameters:**

Name | Type |
------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) |

**Returns:** *Promise‹[Address](../modules/_base_.md#address)[]›*

The list of whitelisted oracles for a given token.

___

###  getRates

▸ **getRates**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:197](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L197)*

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

*Defined in [contractkit/src/wrappers/SortedOracles.ts:233](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L233)*

**Parameters:**

Name | Type |
------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) |

**Returns:** *Promise‹[OracleReport](../interfaces/_wrappers_sortedoracles_.oraclereport.md)[]›*

___

###  getStableTokenRates

▸ **getStableTokenRates**(): *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:189](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L189)*

Helper function to get the rates for StableToken, by passing the address
of StableToken to `getRates`.

**Returns:** *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

___

###  getTimestamps

▸ **getTimestamps**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹[OracleTimestamp](../interfaces/_wrappers_sortedoracles_.oracletimestamp.md)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:218](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L218)*

Gets all elements from the doubly linked list.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken representing the token for which the Celo   Gold exchange rate is being reported. Example: CeloContract.StableToken |

**Returns:** *Promise‹[OracleTimestamp](../interfaces/_wrappers_sortedoracles_.oracletimestamp.md)[]›*

An unpacked list of elements from largest to smallest.

___

###  isOldestReportExpired

▸ **isOldestReportExpired**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹[boolean, [Address](../modules/_base_.md#address)]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:112](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L112)*

Checks if the oldest report for a given token is expired

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The token for which to check reports  |

**Returns:** *Promise‹[boolean, [Address](../modules/_base_.md#address)]›*

___

###  isOracle

▸ **isOracle**(`token`: [CeloToken](../modules/_base_.md#celotoken), `oracle`: [Address](../modules/_base_.md#address)): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L84)*

Checks if the given address is whitelisted as an oracle for the token

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken token |
`oracle` | [Address](../modules/_base_.md#address) | The address that we're checking the oracle status of |

**Returns:** *Promise‹boolean›*

boolean describing whether this account is an oracle

___

###  medianRate

▸ **medianRate**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹[MedianRate](../interfaces/_wrappers_sortedoracles_.medianrate.md)›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L70)*

Returns the median rate for the given token

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken token for which the Celo Gold exchange rate is being reported. |

**Returns:** *Promise‹[MedianRate](../interfaces/_wrappers_sortedoracles_.medianrate.md)›*

The median exchange rate for `token`, expressed as:
  amount of that token / equivalent amount in Celo Gold

___

###  numRates

▸ **numRates**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹number›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L58)*

Gets the number of rates that have been reported for the given token

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken token for which the Celo Gold exchange rate is being reported. |

**Returns:** *Promise‹number›*

The number of reported oracle rates for `token`.

___

###  removeExpiredReports

▸ **removeExpiredReports**(`token`: [CeloToken](../modules/_base_.md#celotoken), `numReports?`: undefined | number): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:125](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L125)*

Removes expired reports, if any exist

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The token to remove reports for |
`numReports?` | undefined &#124; number | The upper-limit of reports to remove. For example, if there are 2 expired reports, and this param is 5, it will only remove the 2 that are expired.  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  report

▸ **report**(`token`: [CeloToken](../modules/_base_.md#celotoken), `value`: BigNumber.Value, `oracleAddress`: [Address](../modules/_base_.md#address)): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:144](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L144)*

Updates an oracle value and the median.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The token for which the Celo Gold exchange rate is being reported. |
`value` | BigNumber.Value | The amount of `token` equal to one Celo Gold.  |
`oracleAddress` | [Address](../modules/_base_.md#address) | - |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  reportStableToken

▸ **reportStableToken**(`value`: BigNumber.Value, `oracleAddress`: [Address](../modules/_base_.md#address)): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:169](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L169)*

Updates an oracle value and the median.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`value` | BigNumber.Value | The amount of US Dollars equal to one Celo Gold.  |
`oracleAddress` | [Address](../modules/_base_.md#address) | - |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*
