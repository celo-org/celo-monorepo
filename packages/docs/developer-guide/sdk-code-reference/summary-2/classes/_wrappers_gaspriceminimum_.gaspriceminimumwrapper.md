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
* [eventTypes](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#eventtypes)
* [events](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#events)
* [gasPriceMinimum](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#gaspriceminimum)
* [getGasPriceMinimum](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#getgaspriceminimum)
* [methodIds](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#methodids)
* [targetDensity](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#targetdensity)

### Accessors

* [address](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#address)

### Methods

* [getConfig](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#getconfig)
* [getPastEvents](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#getpastevents)

## Constructors

### constructor

+ **new GasPriceMinimumWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: GasPriceMinimum\): [_GasPriceMinimumWrapper_](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | GasPriceMinimum |

**Returns:** [_GasPriceMinimumWrapper_](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)

## Properties

### adjustmentSpeed

• **adjustmentSpeed**: _function_ = proxyCall\( this.contract.methods.adjustmentSpeed, undefined, fixidityValueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L44)

Query adjustment speed parameter

**`returns`** multiplier that impacts how quickly gas price minimum is adjusted.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_eventTypes_](_wrappers_basewrapper_.basewrapper.md#eventtypes)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _GasPriceMinimum\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### gasPriceMinimum

• **gasPriceMinimum**: _function_ = proxyCall\(this.contract.methods.gasPriceMinimum, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L19)

Query current gas price minimum in CELO.

**`returns`** current gas price minimum in CELO

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getGasPriceMinimum

• **getGasPriceMinimum**: _function_ = proxyCall\( this.contract.methods.getGasPriceMinimum, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L25)

Query current gas price minimum.

**`returns`** current gas price minimum in the requested currency

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

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

### targetDensity

• **targetDensity**: _function_ = proxyCall\( this.contract.methods.targetDensity, undefined, fixidityValueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L35)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getConfig

▸ **getConfig**\(\): _Promise‹_[_GasPriceMinimumConfig_](../interfaces/_wrappers_gaspriceminimum_.gaspriceminimumconfig.md)_›_

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L52)

Returns current configuration parameters.

**Returns:** _Promise‹_[_GasPriceMinimumConfig_](../interfaces/_wrappers_gaspriceminimum_.gaspriceminimumconfig.md)_›_

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹GasPriceMinimum›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_getPastEvents_](_wrappers_basewrapper_.basewrapper.md#getpastevents)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹GasPriceMinimum› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

