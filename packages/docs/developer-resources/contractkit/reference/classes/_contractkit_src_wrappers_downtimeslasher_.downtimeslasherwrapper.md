# Class: DowntimeSlasherWrapper

Contract handling slashing for Validator downtime using intervals.

## Hierarchy

* [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)‹DowntimeSlasher›

  ↳ **DowntimeSlasherWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#constructor)

### Properties

* [events](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#events)
* [getBitmapForInterval](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#getbitmapforinterval)
* [getEpochSize](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#getepochsize)
* [isBitmapSetForInterval](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#isbitmapsetforinterval)
* [setBitmapForInterval](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#setbitmapforinterval)
* [slashableDowntime](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashabledowntime)
* [slashingIncentives](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashingincentives)
* [wasDownForInterval](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#wasdownforinterval)
* [wasDownForIntervals](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#wasdownforintervals)

### Accessors

* [address](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#address)

### Methods

* [getConfig](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#getconfig)
* [getPastEvents](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#getpastevents)
* [getValidatorSignerIndex](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#getvalidatorsignerindex)
* [slashStartSignerIndex](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashstartsignerindex)
* [slashValidator](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashvalidator)
* [wasValidatorDown](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#wasvalidatordown)
* [wasValidatorDownForInterval](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md#wasvalidatordownforinterval)

## Constructors

###  constructor

\+ **new DowntimeSlasherWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: DowntimeSlasher): *[DowntimeSlasherWrapper](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | DowntimeSlasher |

**Returns:** *[DowntimeSlasherWrapper](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md)*

## Properties

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[events](_contractkit_src_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  getBitmapForInterval

• **getBitmapForInterval**: *function* = proxyCall(
    this.contract.methods.getBitmapForInterval,
    undefined,
    solidityBytesToString
  )

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L86)*

Calculates and returns the signature bitmap for the specified interval.

**`param`** First block of the downtime interval.

**`param`** Last block of the downtime interval.

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

###  getEpochSize

• **getEpochSize**: *function* = proxyCall(this.contract.methods.getEpochSize, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L54)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isBitmapSetForInterval

• **isBitmapSetForInterval**: *function* = proxyCall(this.contract.methods.isBitmapSetForInterval)

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:109](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L109)*

Shows if the user already called the `setBitmapForInterval` for
the specific interval.

**`param`** First block of a calculated downtime interval.

**`param`** Last block of the calculated downtime interval.

**`returns`** True if the user already called the `setBitmapForInterval` for
the specific interval.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setBitmapForInterval

• **setBitmapForInterval**: *function* = proxySend(this.kit, this.contract.methods.setBitmapForInterval)

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L99)*

Calculates and sets the signature bitmap for the specified interval.

**`param`** First block of the downtime interval.

**`param`** Last block of the downtime interval.

**`returns`** The signature bitmap for the specified interval.

**`dev`** startBlock and endBlock must be in the same epoch.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  slashableDowntime

• **slashableDowntime**: *function* = proxyCall(this.contract.methods.slashableDowntime, undefined, valueToInt)

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L52)*

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

• **slashingIncentives**: *function* = proxyCall(this.contract.methods.slashingIncentives, undefined, (res): {
    reward: BigNumber
    penalty: BigNumber
  } => ({
    reward: valueToBigNumber(res.reward),
    penalty: valueToBigNumber(res.penalty),
  }))

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L39)*

Returns slashing incentives.

**`returns`** Rewards and penalties for slashing.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  wasDownForInterval

• **wasDownForInterval**: *function* = proxyCall(this.contract.methods.wasDownForInterval)

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L75)*

Check if a validator appears down in the bitmap for the interval of blocks.
Both startBlock and endBlock should be part of the same epoch.

**`param`** First block of the interval.

**`param`** Last block of the interval.

**`param`** Index of the signer within the validator set.

**`returns`** True if the validator does not appear in the bitmap of the interval.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  wasDownForIntervals

• **wasDownForIntervals**: *function* = proxyCall(this.contract.methods.wasDownForIntervals)

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:137](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L137)*

Returns true if a validator has been down for the specified overlapping or adjacent
intervals.

**`param`** startBlocks of the specified intervals.

**`param`** endBlocks of the specified intervals.

**`param`** Indices of the signers within the validator set for every epoch change.

**`returns`** True if the validator signature does not appear in any block within the window.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[address](_contractkit_src_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  getConfig

▸ **getConfig**(): *Promise‹[DowntimeSlasherConfig](../interfaces/_contractkit_src_wrappers_downtimeslasher_.downtimeslasherconfig.md)›*

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L59)*

Returns current configuration parameters.

**Returns:** *Promise‹[DowntimeSlasherConfig](../interfaces/_contractkit_src_wrappers_downtimeslasher_.downtimeslasherconfig.md)›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: string, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_contractkit_src_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L29)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | string |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getValidatorSignerIndex

▸ **getValidatorSignerIndex**(`validatorOrSignerAddress`: [Address](../modules/_contractkit_src_base_.md#address), `blockNumber`: number): *Promise‹number›*

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:174](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L174)*

Determines the validator signer given an account or signer address and block number.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorOrSignerAddress` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the validator account or signer. |
`blockNumber` | number | Block at which to determine the signer index.  |

**Returns:** *Promise‹number›*

___

###  slashStartSignerIndex

▸ **slashStartSignerIndex**(`startSignerIndex`: number, `startBlocks`: number[], `endBlocks`: number[]): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:223](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L223)*

Returns true if a validator has been down for the specified overlapping or adjacent
intervals.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`startSignerIndex` | number | Validator index at the first block. |
`startBlocks` | number[] | startBlocks of the specified intervals. |
`endBlocks` | number[] | endBlocks of the specified intervals.  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  slashValidator

▸ **slashValidator**(`validatorOrSignerAddress`: [Address](../modules/_contractkit_src_base_.md#address), `startBlocks`: number[], `endBlocks`: number[]): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:199](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L199)*

Returns true if a validator has been down for the specified overlapping or adjacent
intervals.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorOrSignerAddress` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the validator account or signer. |
`startBlocks` | number[] | startBlocks of the specified intervals. |
`endBlocks` | number[] | endBlocks of the specified intervals.  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  wasValidatorDown

▸ **wasValidatorDown**(`validatorOrSignerAddress`: [Address](../modules/_contractkit_src_base_.md#address), `startBlocks`: number[], `endBlocks`: number[]): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L147)*

Returns true if a validator has been down for the specified overlapping or adjacent
intervals.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorOrSignerAddress` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the validator account or signer. |
`startBlocks` | number[] | startBlocks of the specified intervals. |
`endBlocks` | number[] | endBlocks of the specified intervals. |

**Returns:** *Promise‹boolean›*

True if the validator signature does not appear in any block within the window.

___

###  wasValidatorDownForInterval

▸ **wasValidatorDownForInterval**(`validatorOrSignerAddress`: [Address](../modules/_contractkit_src_base_.md#address), `startBlock`: number, `endBlock`: number): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L117)*

Tests if the given validator or signer has been down in the interval.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorOrSignerAddress` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the validator account or signer. |
`startBlock` | number | First block of the interval. |
`endBlock` | number | Last block of the interval.  |

**Returns:** *Promise‹boolean›*
