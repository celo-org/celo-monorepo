[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/EpochRewards"](../modules/_wrappers_epochrewards_.md) › [EpochRewardsWrapper](_wrappers_epochrewards_.epochrewardswrapper.md)

# Class: EpochRewardsWrapper

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹EpochRewards›

  ↳ **EpochRewardsWrapper**

## Index

### Constructors

* [constructor](_wrappers_epochrewards_.epochrewardswrapper.md#constructor)

### Properties

* [eventTypes](_wrappers_epochrewards_.epochrewardswrapper.md#eventtypes)
* [events](_wrappers_epochrewards_.epochrewardswrapper.md#events)
* [getCommunityReward](_wrappers_epochrewards_.epochrewardswrapper.md#getcommunityreward)
* [getRewardsMultiplierParameters](_wrappers_epochrewards_.epochrewardswrapper.md#getrewardsmultiplierparameters)
* [getTargetValidatorEpochPayment](_wrappers_epochrewards_.epochrewardswrapper.md#gettargetvalidatorepochpayment)
* [getTargetVotingYieldParameters](_wrappers_epochrewards_.epochrewardswrapper.md#gettargetvotingyieldparameters)
* [methodIds](_wrappers_epochrewards_.epochrewardswrapper.md#methodids)

### Accessors

* [address](_wrappers_epochrewards_.epochrewardswrapper.md#address)

### Methods

* [getCarbonOffsetting](_wrappers_epochrewards_.epochrewardswrapper.md#getcarbonoffsetting)
* [getConfig](_wrappers_epochrewards_.epochrewardswrapper.md#getconfig)
* [getPastEvents](_wrappers_epochrewards_.epochrewardswrapper.md#getpastevents)
* [version](_wrappers_epochrewards_.epochrewardswrapper.md#version)

## Constructors

###  constructor

\+ **new EpochRewardsWrapper**(`connection`: Connection, `contract`: EpochRewards): *[EpochRewardsWrapper](_wrappers_epochrewards_.epochrewardswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | EpochRewards |

**Returns:** *[EpochRewardsWrapper](_wrappers_epochrewards_.epochrewardswrapper.md)*

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

• **events**: *EpochRewards["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  getCommunityReward

• **getCommunityReward**: *function* = proxyCall(
    this.contract.methods.getCommunityRewardFraction,
    undefined,
    parseFixidity
  )

*Defined in [packages/sdk/contractkit/src/wrappers/EpochRewards.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/EpochRewards.ts#L28)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getRewardsMultiplierParameters

• **getRewardsMultiplierParameters**: *function* = proxyCall(
    this.contract.methods.getRewardsMultiplierParameters,
    undefined,
    (res) => ({
      max: parseFixidity(res[0]),
      underspendAdjustment: parseFixidity(res[1]),
      overspendAdjustment: parseFixidity(res[2]),
    })
  )

*Defined in [packages/sdk/contractkit/src/wrappers/EpochRewards.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/EpochRewards.ts#L8)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getTargetValidatorEpochPayment

• **getTargetValidatorEpochPayment**: *function* = proxyCall(
    this.contract.methods.targetValidatorEpochPayment,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/EpochRewards.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/EpochRewards.ts#L43)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getTargetVotingYieldParameters

• **getTargetVotingYieldParameters**: *function* = proxyCall(
    this.contract.methods.getTargetVotingYieldParameters,
    undefined,
    (res) => ({
      target: parseFixidity(res[0]),
      max: parseFixidity(res[1]),
      adjustment: parseFixidity(res[2]),
    })
  )

*Defined in [packages/sdk/contractkit/src/wrappers/EpochRewards.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/EpochRewards.ts#L18)*

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

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  getCarbonOffsetting

▸ **getCarbonOffsetting**(): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/EpochRewards.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/EpochRewards.ts#L34)*

**Returns:** *Promise‹object›*

___

###  getConfig

▸ **getConfig**(): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/EpochRewards.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/EpochRewards.ts#L49)*

**Returns:** *Promise‹object›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹EpochRewards›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹EpochRewards› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
