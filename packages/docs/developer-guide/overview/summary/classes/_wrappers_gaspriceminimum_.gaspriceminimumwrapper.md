# GasPriceMinimumWrapper

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

## Constructors

### constructor

+ **new GasPriceMinimumWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: GasPriceMinimum\): [_GasPriceMinimumWrapper_](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | GasPriceMinimum |

**Returns:** [_GasPriceMinimumWrapper_](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)

## Properties

### adjustmentSpeed

• **adjustmentSpeed**: _function_ = proxyCall\( this.contract.methods.adjustmentSpeed, undefined, fixidityValueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L44)

Query adjustment speed parameter

**`returns`** multiplier that impacts how quickly gas price minimum is adjusted.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### gasPriceMinimum

• **gasPriceMinimum**: _function_ = proxyCall\(this.contract.methods.gasPriceMinimum, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L19)

Query current gas price minimum in gGLD.

**`returns`** current gas price minimum in cGLD

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getGasPriceMinimum

• **getGasPriceMinimum**: _function_ = proxyCall\( this.contract.methods.getGasPriceMinimum, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L25)

Query current gas price minimum.

**`returns`** current gas price minimum in the requested currency

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### targetDensity

• **targetDensity**: _function_ = proxyCall\( this.contract.methods.targetDensity, undefined, fixidityValueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L35)

Query target density parameter.

**`returns`** the current block density targeted by the gas price minimum algorithm.

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

▸ **getConfig**\(\): _Promise‹_[_GasPriceMinimumConfig_](../interfaces/_wrappers_gaspriceminimum_.gaspriceminimumconfig.md)_›_

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L52)

Returns current configuration parameters.

**Returns:** _Promise‹_[_GasPriceMinimumConfig_](../interfaces/_wrappers_gaspriceminimum_.gaspriceminimumconfig.md)_›_

