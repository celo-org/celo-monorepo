# Class: DowntimeSlasherWrapper

Contract handling slashing for Validator downtime

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹DowntimeSlasher›

  ↳ **DowntimeSlasherWrapper**

## Index

### Constructors

* [constructor](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#constructor)

### Properties

* [events](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#events)
* [isDown](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#isdown)
* [slashableDowntime](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashabledowntime)
* [slashingIncentives](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashingincentives)

### Accessors

* [address](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#address)

### Methods

* [getConfig](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#getconfig)
* [slashEndSignerIndex](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashendsignerindex)
* [slashStartSignerIndex](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashstartsignerindex)
* [slashValidator](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashvalidator)

## Constructors

###  constructor

\+ **new DowntimeSlasherWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: DowntimeSlasher): *[DowntimeSlasherWrapper](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | DowntimeSlasher |

**Returns:** *[DowntimeSlasherWrapper](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)*

## Properties

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  isDown

• **isDown**: *function* = proxyCall(this.contract.methods.isDown)

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L48)*

Tests if a validator has been down.

**`param`** First block of the downtime.

**`param`** Validator index at the first block.

**`param`** Validator index at the last block.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  slashableDowntime

• **slashableDowntime**: *function* = proxyCall(this.contract.methods.slashableDowntime, undefined, valueToInt)

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L40)*

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

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L27)*

Returns slashing incentives.

**`returns`** Rewards and penaltys for slashing.

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

▸ **getConfig**(): *Promise‹[DowntimeSlasherConfig](../interfaces/_wrappers_downtimeslasher_.downtimeslasherconfig.md)›*

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:175](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L175)*

Returns current configuration parameters.

**Returns:** *Promise‹[DowntimeSlasherConfig](../interfaces/_wrappers_downtimeslasher_.downtimeslasherconfig.md)›*

___

###  slashEndSignerIndex

▸ **slashEndSignerIndex**(`endBlock`: number, `endSignerIndex`: number): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:109](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L109)*

Slash a Validator for downtime.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`endBlock` | number | The last block of the downtime to slash for. |
`endSignerIndex` | number | Validator index at the last block.  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  slashStartSignerIndex

▸ **slashStartSignerIndex**(`startBlock`: number, `startSignerIndex`: number): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L85)*

Slash a Validator for downtime.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`startBlock` | number | First block of the downtime. |
`startSignerIndex` | number | Validator index at the first block.  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  slashValidator

▸ **slashValidator**(`validatorAddress`: [Address](../modules/_base_.md#address), `startBlock?`: undefined | number, `endBlock?`: undefined | number): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/DowntimeSlasher.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L56)*

Slash a Validator for downtime.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorAddress` | [Address](../modules/_base_.md#address) | - |
`startBlock?` | undefined &#124; number | First block of the downtime, undefined if using endBlock. |
`endBlock?` | undefined &#124; number | Last block of the downtime.  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*
