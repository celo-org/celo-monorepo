[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/DowntimeSlasher"](../modules/_wrappers_downtimeslasher_.md) › [DowntimeSlasherWrapper](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)

# Class: DowntimeSlasherWrapper

Contract handling slashing for Validator downtime using intervals.

## Hierarchy

  ↳ [BaseSlasher](_wrappers_baseslasher_.baseslasher.md)‹DowntimeSlasher›

  ↳ **DowntimeSlasherWrapper**

## Index

### Constructors

* [constructor](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#constructor)

### Properties

* [eventTypes](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#eventtypes)
* [events](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#events)
* [getBitmapForInterval](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#getbitmapforinterval)
* [isBitmapSetForInterval](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#isbitmapsetforinterval)
* [lastSlashedBlock](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#lastslashedblock)
* [methodIds](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#methodids)
* [setBitmapForInterval](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#setbitmapforinterval)
* [slashableDowntime](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashabledowntime)
* [slashingIncentives](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashingincentives)

### Accessors

* [address](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#address)

### Methods

* [getConfig](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#getconfig)
* [getHumanReadableConfig](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#gethumanreadableconfig)
* [getPastEvents](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#getpastevents)
* [isBitmapSetForIntervals](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#isbitmapsetforintervals)
* [slashValidator](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashvalidator)
* [slashableDowntimeIntervalsBefore](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashabledowntimeintervalsbefore)
* [version](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#version)
* [wasValidatorDownForInterval](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#wasvalidatordownforinterval)
* [wasValidatorDownForIntervals](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#wasvalidatordownforintervals)

## Constructors

###  constructor

\+ **new DowntimeSlasherWrapper**(`connection`: Connection, `contract`: DowntimeSlasher, `contracts`: ContractWrappersForVotingAndRules): *[DowntimeSlasherWrapper](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)*

*Inherited from [ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md).[constructor](_wrappers_validators_.validatorswrapper.md#constructor)*

*Overrides [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | DowntimeSlasher |
`contracts` | ContractWrappersForVotingAndRules |

**Returns:** *[DowntimeSlasherWrapper](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)*

## Properties

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L63)*

___

###  events

• **events**: *DowntimeSlasher["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  getBitmapForInterval

• **getBitmapForInterval**: *function* = proxyCall(
    this.contract.methods.getBitmapForInterval,
    unpackInterval,
    solidityBytesToString
  )

*Defined in [packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L73)*

Calculates and returns the signature bitmap for the specified interval.
Similar to the parentSealBitmap of every block (where you have which validators were
able to sign the previous block), this bitmap shows for that specific interval which
validators signed at least one block

**`param`** First and last block of the interval.

**`returns`** (string) The signature uptime bitmap for the specified interval.

**`dev`** startBlock and endBlock must be in the same epoch.

**`dev`** The getParentSealBitmap precompile requires that startBlock must be within 4 epochs of
the current block.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isBitmapSetForInterval

• **isBitmapSetForInterval**: *function* = proxyCall(this.contract.methods.isBitmapSetForInterval, unpackInterval)

*Defined in [packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts:126](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L126)*

Shows if the user already called the `setBitmapForInterval` for
the specific interval.

**`param`** First and last block of the interval.

**`returns`** True if the user already called the `setBitmapForInterval` for
the specific interval.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  lastSlashedBlock

• **lastSlashedBlock**: *function* = proxyCall(this.contract.methods.lastSlashedBlock, undefined, valueToInt)

*Defined in [packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts:140](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L140)*

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

###  setBitmapForInterval

• **setBitmapForInterval**: *function* = proxySend(
    this.connection,
    this.contract.methods.setBitmapForInterval,
    unpackInterval
  )

*Defined in [packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L85)*

Calculates and sets the signature bitmap for the specified interval.

**`param`** First and last block of the interval.

**`dev`** interval.start and interval.end must be in the same epoch.

**`returns`** The signature bitmap for the specified interval.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  slashableDowntime

• **slashableDowntime**: *function* = proxyCall(this.contract.methods.slashableDowntime, undefined, valueToInt)

*Defined in [packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L37)*

Returns slashable downtime in blocks.

**`returns`** The number of consecutive blocks before a Validator missing from IBFT consensus
can be slashed.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  slashingIncentives

• **slashingIncentives**: *function* = proxyCall(
    this.contract.methods.slashingIncentives,
    undefined,
    (res) => ({
      reward: valueToBigNumber(res.reward),
      penalty: valueToBigNumber(res.penalty),
    })
  )

*Inherited from [BaseSlasher](_wrappers_baseslasher_.baseslasher.md).[slashingIncentives](_wrappers_baseslasher_.baseslasher.md#slashingincentives)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseSlasher.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseSlasher.ts#L70)*

Returns slashing incentives.

**`returns`** Rewards and penalties for slashing.

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

▸ **getConfig**(): *Promise‹[DowntimeSlasherConfig](../interfaces/_wrappers_downtimeslasher_.downtimeslasherconfig.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L42)*

Returns current configuration parameters.

**Returns:** *Promise‹[DowntimeSlasherConfig](../interfaces/_wrappers_downtimeslasher_.downtimeslasherconfig.md)›*

___

###  getHumanReadableConfig

▸ **getHumanReadableConfig**(): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L54)*

**`dev`** Returns human readable configuration of the downtime slasher contract

**Returns:** *Promise‹object›*

DowntimeSlasherConfig object

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹DowntimeSlasher›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹DowntimeSlasher› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  isBitmapSetForIntervals

▸ **isBitmapSetForIntervals**(`intervals`: [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)[]): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts:133](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L133)*

Shows if the user already called the `setBitmapForInterval` for intervals.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`intervals` | [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)[] | First and last block of the interval. |

**Returns:** *Promise‹boolean›*

True if the user already called the `setBitmapForInterval` for intervals.

___

###  slashValidator

▸ **slashValidator**(`address`: Address, `intervals`: [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)[]): *Promise‹CeloTransactionObject‹void››*

*Defined in [packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts:174](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L174)*

Returns true if the validator did not sign any blocks for the specified overlapping or adjacent
intervals.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the validator account or signer. |
`intervals` | [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)[] | A list of ordered intervals for which signature bitmaps have already been set.  |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  slashableDowntimeIntervalsBefore

▸ **slashableDowntimeIntervalsBefore**(`block?`: undefined | number, `maximumLength`: number): *Promise‹[Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L98)*

Calculates intervals which span `slashableDowntime` before provided block.

**`dev`** if block is undefined, latest will be used

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`block?` | undefined &#124; number | - | Block number to build intervals before. |
`maximumLength` | number | 4000 | Maximum length for any interval (limited by gas limit). |

**Returns:** *Promise‹[Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)[]›*

The signature bitmap for the specified interval.

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

___

###  wasValidatorDownForInterval

▸ **wasValidatorDownForInterval**(`address`: Address, `interval`: [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L147)*

Tests if the given validator or signer did not sign any blocks in the interval.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the validator account or signer. |
`interval` | [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md) | First and last block of the interval.  |

**Returns:** *Promise‹boolean›*

___

###  wasValidatorDownForIntervals

▸ **wasValidatorDownForIntervals**(`address`: Address, `intervals`: [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)[]): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts:161](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L161)*

Returns true if the validator did not sign any blocks for the specified overlapping or adjacent
intervals.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the validator account or signer. |
`intervals` | [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)[] | - |

**Returns:** *Promise‹boolean›*

True if the validator signature does not appear in any block within the window.
