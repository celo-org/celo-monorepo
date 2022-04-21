[@celo/contractkit](../README.md) › ["wrappers/Freezer"](../modules/_wrappers_freezer_.md) › [FreezerWrapper](_wrappers_freezer_.freezerwrapper.md)

# Class: FreezerWrapper

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Freezer›

  ↳ **FreezerWrapper**

## Index

### Constructors

* [constructor](_wrappers_freezer_.freezerwrapper.md#constructor)

### Properties

* [eventTypes](_wrappers_freezer_.freezerwrapper.md#eventtypes)
* [events](_wrappers_freezer_.freezerwrapper.md#events)
* [freeze](_wrappers_freezer_.freezerwrapper.md#freeze)
* [isFrozen](_wrappers_freezer_.freezerwrapper.md#isfrozen)
* [methodIds](_wrappers_freezer_.freezerwrapper.md#methodids)
* [unfreeze](_wrappers_freezer_.freezerwrapper.md#unfreeze)

### Accessors

* [address](_wrappers_freezer_.freezerwrapper.md#address)

### Methods

* [getPastEvents](_wrappers_freezer_.freezerwrapper.md#getpastevents)
* [version](_wrappers_freezer_.freezerwrapper.md#version)

## Constructors

###  constructor

\+ **new FreezerWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Freezer): *[FreezerWrapper](_wrappers_freezer_.freezerwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Freezer |

**Returns:** *[FreezerWrapper](_wrappers_freezer_.freezerwrapper.md)*

## Properties

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  events

• **events**: *Freezer["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L59)*

___

###  freeze

• **freeze**: *function* = proxySend(this.kit, this.contract.methods.freeze)

*Defined in [packages/sdk/contractkit/src/wrappers/Freezer.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Freezer.ts#L5)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isFrozen

• **isFrozen**: *function* = proxyCall(this.contract.methods.isFrozen)

*Defined in [packages/sdk/contractkit/src/wrappers/Freezer.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Freezer.ts#L7)*

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
          : this.kit.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L66)*

___

###  unfreeze

• **unfreeze**: *function* = proxySend(this.kit, this.contract.methods.unfreeze)

*Defined in [packages/sdk/contractkit/src/wrappers/Freezer.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Freezer.ts#L6)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)*

Contract address

**Returns:** *string*

## Methods

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹Freezer›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L55)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹Freezer› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
