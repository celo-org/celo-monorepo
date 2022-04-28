[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/BaseSlasher"](../modules/_wrappers_baseslasher_.md) › [BaseSlasher](_wrappers_baseslasher_.baseslasher.md)

# Class: BaseSlasher <**T**>

## Type parameters

▪ **T**: *SlasherContract*

## Hierarchy

  ↳ [BaseWrapperForGoverning](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md)‹T›

  ↳ **BaseSlasher**

  ↳ [DowntimeSlasherWrapper](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)

  ↳ [DoubleSigningSlasherWrapper](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)

## Index

### Constructors

* [constructor](_wrappers_baseslasher_.baseslasher.md#constructor)

### Properties

* [eventTypes](_wrappers_baseslasher_.baseslasher.md#eventtypes)
* [events](_wrappers_baseslasher_.baseslasher.md#events)
* [methodIds](_wrappers_baseslasher_.baseslasher.md#methodids)
* [slashingIncentives](_wrappers_baseslasher_.baseslasher.md#slashingincentives)

### Accessors

* [address](_wrappers_baseslasher_.baseslasher.md#address)

### Methods

* [getPastEvents](_wrappers_baseslasher_.baseslasher.md#getpastevents)
* [version](_wrappers_baseslasher_.baseslasher.md#version)

## Constructors

###  constructor

\+ **new BaseSlasher**(`connection`: Connection, `contract`: T, `contracts`: ContractWrappersForVotingAndRules): *[BaseSlasher](_wrappers_baseslasher_.baseslasher.md)*

*Inherited from [ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md).[constructor](_wrappers_validators_.validatorswrapper.md#constructor)*

*Overrides [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | T |
`contracts` | ContractWrappersForVotingAndRules |

**Returns:** *[BaseSlasher](_wrappers_baseslasher_.baseslasher.md)*

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

• **events**: *T["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

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

###  slashingIncentives

• **slashingIncentives**: *function* = proxyCall(
    this.contract.methods.slashingIncentives,
    undefined,
    (res) => ({
      reward: valueToBigNumber(res.reward),
      penalty: valueToBigNumber(res.penalty),
    })
  )

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

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹T›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹T› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
