# Class: SortedOraclesWrapper

Currency price oracle contract.

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹SortedOracles›

  ↳ **SortedOraclesWrapper**

## Index

### Constructors

* [constructor](_wrappers_sortedoracles_.sortedoracleswrapper.md#constructor)

### Properties

* [reportExpirySeconds](_wrappers_sortedoracles_.sortedoracleswrapper.md#reportexpiryseconds)

### Accessors

* [address](_wrappers_sortedoracles_.sortedoracleswrapper.md#address)

### Methods

* [getConfig](_wrappers_sortedoracles_.sortedoracleswrapper.md#getconfig)
* [getRates](_wrappers_sortedoracles_.sortedoracleswrapper.md#getrates)
* [getStableTokenRates](_wrappers_sortedoracles_.sortedoracleswrapper.md#getstabletokenrates)
* [isOracle](_wrappers_sortedoracles_.sortedoracleswrapper.md#isoracle)
* [medianRate](_wrappers_sortedoracles_.sortedoracleswrapper.md#medianrate)
* [numRates](_wrappers_sortedoracles_.sortedoracleswrapper.md#numrates)
* [report](_wrappers_sortedoracles_.sortedoracleswrapper.md#report)
* [reportStableToken](_wrappers_sortedoracles_.sortedoracleswrapper.md#reportstabletoken)

## Constructors

###  constructor

\+ **new SortedOraclesWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: SortedOracles): *[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | SortedOracles |

**Returns:** *[SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)*

## Properties

###  reportExpirySeconds

• **reportExpirySeconds**: *function* = proxyCall(
    this.contract.methods.reportExpirySeconds,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/SortedOracles.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L81)*

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

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L18)*

Contract address

**Returns:** *string*

## Methods

###  getConfig

▸ **getConfig**(): *Promise‹[SortedOraclesConfig](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:127](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L127)*

Returns current configuration parameters.

**Returns:** *Promise‹[SortedOraclesConfig](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)›*

___

###  getRates

▸ **getRates**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:145](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L145)*

Gets all elements from the doubly linked list.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken representing the token for which the Celo   Gold exchange rate is being reported. Example: CeloContract.StableToken |

**Returns:** *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

An unpacked list of elements from largest to smallest.

___

###  getStableTokenRates

▸ **getStableTokenRates**(): *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:137](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L137)*

Helper function to get the rates for StableToken, by passing the address
of StableToken to `getRates`.

**Returns:** *Promise‹[OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)[]›*

___

###  isOracle

▸ **isOracle**(`token`: [CeloToken](../modules/_base_.md#celotoken), `oracle`: [Address](../modules/_base_.md#address)): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L72)*

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

*Defined in [contractkit/src/wrappers/SortedOracles.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L58)*

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

*Defined in [contractkit/src/wrappers/SortedOracles.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L46)*

Gets the number of rates that have been reported for the given token

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The CeloToken token for which the Celo Gold exchange rate is being reported. |

**Returns:** *Promise‹number›*

The number of reported oracle rates for `token`.

___

###  report

▸ **report**(`token`: [CeloToken](../modules/_base_.md#celotoken), `value`: BigNumber.Value, `oracleAddress`: [Address](../modules/_base_.md#address)): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:92](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L92)*

Updates an oracle value and the median.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | The address of the token for which the Celo Gold exchange rate is being reported. |
`value` | BigNumber.Value | The amount of `token` equal to one Celo Gold.  |
`oracleAddress` | [Address](../modules/_base_.md#address) | - |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  reportStableToken

▸ **reportStableToken**(`value`: BigNumber.Value, `oracleAddress`: [Address](../modules/_base_.md#address)): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/SortedOracles.ts#L117)*

Updates an oracle value and the median.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`value` | BigNumber.Value | The amount of US Dollars equal to one Celo Gold.  |
`oracleAddress` | [Address](../modules/_base_.md#address) | - |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*
