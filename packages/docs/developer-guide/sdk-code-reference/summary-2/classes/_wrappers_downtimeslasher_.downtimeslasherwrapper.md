# DowntimeSlasherWrapper

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
* [wasValidatorDownForInterval](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#wasvalidatordownforinterval)
* [wasValidatorDownForIntervals](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#wasvalidatordownforintervals)

## Constructors

### constructor

+ **new DowntimeSlasherWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: DowntimeSlasher\): [_DowntimeSlasherWrapper_](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | DowntimeSlasher |

**Returns:** [_DowntimeSlasherWrapper_](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)

## Properties

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_eventTypes_](_wrappers_basewrapper_.basewrapper.md#eventtypes)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _DowntimeSlasher\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### getBitmapForInterval

• **getBitmapForInterval**: _function_ = proxyCall\( this.contract.methods.getBitmapForInterval, unpackInterval, solidityBytesToString \)

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:73_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L73)

Calculates and returns the signature bitmap for the specified interval. Similar to the parentSealBitmap of every block \(where you have which validators were able to sign the previous block\), this bitmap shows for that specific interval which validators signed at least one block

**`param`** First and last block of the interval.

**`returns`** \(string\) The signature uptime bitmap for the specified interval.

**`dev`** startBlock and endBlock must be in the same epoch.

**`dev`** The getParentSealBitmap precompile requires that startBlock must be within 4 epochs of the current block.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isBitmapSetForInterval

• **isBitmapSetForInterval**: _function_ = proxyCall\(this.contract.methods.isBitmapSetForInterval, unpackInterval\)

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:122_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L122)

Shows if the user already called the `setBitmapForInterval` for the specific interval.

**`param`** First and last block of the interval.

**`returns`** True if the user already called the `setBitmapForInterval` for the specific interval.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### lastSlashedBlock

• **lastSlashedBlock**: _function_ = proxyCall\(this.contract.methods.lastSlashedBlock, undefined, valueToInt\)

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:136_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L136)

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

### setBitmapForInterval

• **setBitmapForInterval**: _function_ = proxySend\( this.kit, this.contract.methods.setBitmapForInterval, unpackInterval \)

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:85_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L85)

Calculates and sets the signature bitmap for the specified interval.

**`param`** First and last block of the interval.

**`dev`** interval.start and interval.end must be in the same epoch.

**`returns`** The signature bitmap for the specified interval.

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### slashableDowntime

• **slashableDowntime**: _function_ = proxyCall\(this.contract.methods.slashableDowntime, undefined, valueToInt\)

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L37)

Returns slashable downtime in blocks.

**`returns`** The number of consecutive blocks before a Validator missing from IBFT consensus can be slashed.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### slashingIncentives

• **slashingIncentives**: _function_ = proxyCall\( this.contract.methods.slashingIncentives, undefined, \(res\) =&gt; \({ reward: valueToBigNumber\(res.reward\), penalty: valueToBigNumber\(res.penalty\), }\) \)

_Inherited from_ [_BaseSlasher_](_wrappers_baseslasher_.baseslasher.md)_._[_slashingIncentives_](_wrappers_baseslasher_.baseslasher.md#slashingincentives)

_Defined in_ [_contractkit/src/wrappers/BaseSlasher.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseSlasher.ts#L69)

Returns slashing incentives.

**`returns`** Rewards and penalties for slashing.

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

▸ **getConfig**\(\): _Promise‹_[_DowntimeSlasherConfig_](../interfaces/_wrappers_downtimeslasher_.downtimeslasherconfig.md)_›_

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L42)

Returns current configuration parameters.

**Returns:** _Promise‹_[_DowntimeSlasherConfig_](../interfaces/_wrappers_downtimeslasher_.downtimeslasherconfig.md)_›_

### getHumanReadableConfig

▸ **getHumanReadableConfig**\(\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:54_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L54)

**`dev`** Returns human readable configuration of the downtime slasher contract

**Returns:** _Promise‹object›_

DowntimeSlasherConfig object

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹DowntimeSlasher›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_getPastEvents_](_wrappers_basewrapper_.basewrapper.md#getpastevents)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹DowntimeSlasher› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### isBitmapSetForIntervals

▸ **isBitmapSetForIntervals**\(`intervals`: [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)\[\]\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:129_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L129)

Shows if the user already called the `setBitmapForInterval` for intervals.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `intervals` | [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)\[\] | First and last block of the interval. |

**Returns:** _Promise‹boolean›_

True if the user already called the `setBitmapForInterval` for intervals.

### slashValidator

▸ **slashValidator**\(`address`: Address, `intervals`: [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)\[\]\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:170_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L170)

Returns true if the validator did not sign any blocks for the specified overlapping or adjacent intervals.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Address of the validator account or signer. |
| `intervals` | [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)\[\] | A list of ordered intervals for which signature bitmaps have already been set. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

### slashableDowntimeIntervalsBefore

▸ **slashableDowntimeIntervalsBefore**\(`block?`: undefined \| number, `maximumLength`: number\): _Promise‹_[_Interval_](../interfaces/_wrappers_downtimeslasher_.interval.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:98_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L98)

Calculates intervals which span `slashableDowntime` before provided block.

**`dev`** if block is undefined, latest will be used

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `block?` | undefined \| number | - | Block number to build intervals before. |
| `maximumLength` | number | 4000 | Maximum length for any interval \(limited by gas limit\). |

**Returns:** _Promise‹_[_Interval_](../interfaces/_wrappers_downtimeslasher_.interval.md)_\[\]›_

The signature bitmap for the specified interval.

### wasValidatorDownForInterval

▸ **wasValidatorDownForInterval**\(`address`: Address, `interval`: [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:143_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L143)

Tests if the given validator or signer did not sign any blocks in the interval.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Address of the validator account or signer. |
| `interval` | [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md) | First and last block of the interval. |

**Returns:** _Promise‹boolean›_

### wasValidatorDownForIntervals

▸ **wasValidatorDownForIntervals**\(`address`: Address, `intervals`: [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)\[\]\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DowntimeSlasher.ts#L157)

Returns true if the validator did not sign any blocks for the specified overlapping or adjacent intervals.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Address of the validator account or signer. |
| `intervals` | [Interval](../interfaces/_wrappers_downtimeslasher_.interval.md)\[\] | - |

**Returns:** _Promise‹boolean›_

True if the validator signature does not appear in any block within the window.

