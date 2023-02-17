[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/BaseWrapperForGoverning"](../modules/_wrappers_basewrapperforgoverning_.md) › [BaseWrapperForGoverning](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md)

# Class: BaseWrapperForGoverning <**T**>

**`internal`** 

## Type parameters

▪ **T**: *Contract*

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹T›

  ↳ **BaseWrapperForGoverning**

  ↳ [ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)

  ↳ [ElectionWrapper](_wrappers_election_.electionwrapper.md)

  ↳ [LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)

  ↳ [BaseSlasher](_wrappers_baseslasher_.baseslasher.md)

  ↳ [GovernanceWrapper](_wrappers_governance_.governancewrapper.md)

  ↳ [ReleaseGoldWrapper](_wrappers_releasegold_.releasegoldwrapper.md)

## Index

### Constructors

* [constructor](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md#constructor)

### Properties

* [eventTypes](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md#eventtypes)
* [events](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md#events)
* [methodIds](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md#methodids)

### Accessors

* [address](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md#address)

### Methods

* [getPastEvents](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md#getpastevents)
* [version](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md#version)

## Constructors

###  constructor

\+ **new BaseWrapperForGoverning**(`connection`: Connection, `contract`: T, `contracts`: ContractWrappersForVotingAndRules): *[BaseWrapperForGoverning](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md)*

*Overrides [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | T |
`contracts` | ContractWrappersForVotingAndRules |

**Returns:** *[BaseWrapperForGoverning](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md)*

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
