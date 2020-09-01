# Class: GasPriceMinimumWrapper

Stores the gas price minimum

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹GasPriceMinimum›

  ↳ **GasPriceMinimumWrapper**

## Index

### Constructors

* [constructor](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#constructor)

### Properties

* [adjustmentSpeed](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#adjustmentspeed)
* [events](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#events)
* [gasPriceMinimum](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#gaspriceminimum)
* [getGasPriceMinimum](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#getgaspriceminimum)
* [targetDensity](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#targetdensity)

### Accessors

* [address](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#address)

### Methods

* [getConfig](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#getconfig)
* [getPastEvents](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#getpastevents)

## Constructors

###  constructor

\+ **new GasPriceMinimumWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: GasPriceMinimum): *[GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | GasPriceMinimum |

**Returns:** *[GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)*

## Properties

###  adjustmentSpeed

• **adjustmentSpeed**: *function* = proxyCall(
    this.contract.methods.adjustmentSpeed,
    undefined,
    fixidityValueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/GasPriceMinimum.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L44)*

Query adjustment speed parameter

**`returns`** multiplier that impacts how quickly gas price minimum is adjusted.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  gasPriceMinimum

• **gasPriceMinimum**: *function* = proxyCall(this.contract.methods.gasPriceMinimum, undefined, valueToBigNumber)

*Defined in [packages/contractkit/src/wrappers/GasPriceMinimum.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L19)*

Query current gas price minimum in CELO.

**`returns`** current gas price minimum in CELO

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getGasPriceMinimum

• **getGasPriceMinimum**: *function* = proxyCall(
    this.contract.methods.getGasPriceMinimum,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/GasPriceMinimum.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L25)*

Query current gas price minimum.

**`returns`** current gas price minimum in the requested currency

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  targetDensity

• **targetDensity**: *function* = proxyCall(
    this.contract.methods.targetDensity,
    undefined,
    fixidityValueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/GasPriceMinimum.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L35)*

Query target density parameter.

**`returns`** the current block density targeted by the gas price minimum algorithm.

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  getConfig

▸ **getConfig**(): *Promise‹[GasPriceMinimumConfig](../interfaces/_wrappers_gaspriceminimum_.gaspriceminimumconfig.md)›*

*Defined in [packages/contractkit/src/wrappers/GasPriceMinimum.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L52)*

Returns current configuration parameters.

**Returns:** *Promise‹[GasPriceMinimumConfig](../interfaces/_wrappers_gaspriceminimum_.gaspriceminimumconfig.md)›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: string, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L29)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | string |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*
