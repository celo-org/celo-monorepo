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

## Constructors

###  constructor

\+ **new FreezerWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Freezer): *[FreezerWrapper](_wrappers_freezer_.freezerwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Freezer |

**Returns:** *[FreezerWrapper](_wrappers_freezer_.freezerwrapper.md)*

## Properties

###  eventTypes

• **eventTypes**: *object* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)*

#### Type declaration:

___

###  events

• **events**: *Freezer["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)*

___

###  freeze

• **freeze**: *function* = proxySend(this.kit, this.contract.methods.freeze)

*Defined in [packages/contractkit/src/wrappers/Freezer.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Freezer.ts#L5)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isFrozen

• **isFrozen**: *function* = proxyCall(this.contract.methods.isFrozen)

*Defined in [packages/contractkit/src/wrappers/Freezer.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Freezer.ts#L7)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  methodIds

• **methodIds**: *object* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)*

#### Type declaration:

___

###  unfreeze

• **unfreeze**: *function* = proxySend(this.kit, this.contract.methods.unfreeze)

*Defined in [packages/contractkit/src/wrappers/Freezer.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Freezer.ts#L6)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)*

Contract address

**Returns:** *string*

## Methods

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹Freezer›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹Freezer› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*
