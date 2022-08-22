[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/GasPriceMinimum"](../modules/_wrappers_gaspriceminimum_.md) › [GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)

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
* [version](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md#version)

## Constructors

###  constructor

\+ **new GasPriceMinimumWrapper**(`connection`: Connection, `contract`: GasPriceMinimum): *[GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | GasPriceMinimum |

**Returns:** *[GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)*

## Properties

###  adjustmentSpeed

• **adjustmentSpeed**: *function* = proxyCall(
    this.contract.methods.adjustmentSpeed,
    undefined,
    fixidityValueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L44)*

Query adjustment speed parameter

**`returns`** multiplier that impacts how quickly gas price minimum is adjusted.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L63)*

___

###  events

• **events**: *GasPriceMinimum["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  gasPriceMinimum

• **gasPriceMinimum**: *function* = proxyCall(this.contract.methods.gasPriceMinimum, undefined, valueToBigNumber)

*Defined in [packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L19)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L25)*

Query current gas price minimum.

**`returns`** current gas price minimum in the requested currency

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  methodIds

• **methodIds**: *Record‹keyof T["methods"], string›* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined
          ? '0x'
          : this.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L68)*

___

###  targetDensity

• **targetDensity**: *function* = proxyCall(
    this.contract.methods.targetDensity,
    undefined,
    fixidityValueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L35)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  getConfig

▸ **getConfig**(): *Promise‹[GasPriceMinimumConfig](../interfaces/_wrappers_gaspriceminimum_.gaspriceminimumconfig.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L52)*

Returns current configuration parameters.

**Returns:** *Promise‹[GasPriceMinimumConfig](../interfaces/_wrappers_gaspriceminimum_.gaspriceminimumconfig.md)›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹GasPriceMinimum›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹GasPriceMinimum› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
