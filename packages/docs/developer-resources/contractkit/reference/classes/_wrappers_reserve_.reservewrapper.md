# Class: ReserveWrapper

Contract for handling reserve for stable currencies

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Reserve›

  ↳ **ReserveWrapper**

## Index

### Constructors

* [constructor](_wrappers_reserve_.reservewrapper.md#constructor)

### Properties

* [eventTypes](_wrappers_reserve_.reservewrapper.md#eventtypes)
* [events](_wrappers_reserve_.reservewrapper.md#events)
* [frozenReserveGoldDays](_wrappers_reserve_.reservewrapper.md#frozenreservegolddays)
* [frozenReserveGoldStartBalance](_wrappers_reserve_.reservewrapper.md#frozenreservegoldstartbalance)
* [frozenReserveGoldStartDay](_wrappers_reserve_.reservewrapper.md#frozenreservegoldstartday)
* [getOrComputeTobinTax](_wrappers_reserve_.reservewrapper.md#getorcomputetobintax)
* [getOtherReserveAddresses](_wrappers_reserve_.reservewrapper.md#getotherreserveaddresses)
* [getReserveGoldBalance](_wrappers_reserve_.reservewrapper.md#getreservegoldbalance)
* [isOtherReserveAddress](_wrappers_reserve_.reservewrapper.md#isotherreserveaddress)
* [isSpender](_wrappers_reserve_.reservewrapper.md#isspender)
* [methodIds](_wrappers_reserve_.reservewrapper.md#methodids)
* [tobinTaxStalenessThreshold](_wrappers_reserve_.reservewrapper.md#tobintaxstalenessthreshold)
* [transferGold](_wrappers_reserve_.reservewrapper.md#transfergold)

### Accessors

* [address](_wrappers_reserve_.reservewrapper.md#address)

### Methods

* [getConfig](_wrappers_reserve_.reservewrapper.md#getconfig)
* [getPastEvents](_wrappers_reserve_.reservewrapper.md#getpastevents)
* [getSpenders](_wrappers_reserve_.reservewrapper.md#getspenders)

## Constructors

###  constructor

\+ **new ReserveWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Reserve): *[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Reserve |

**Returns:** *[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)*

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

• **events**: *Reserve["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)*

___

###  frozenReserveGoldDays

• **frozenReserveGoldDays**: *function* = proxyCall(
    this.contract.methods.frozenReserveGoldDays,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/Reserve.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L41)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  frozenReserveGoldStartBalance

• **frozenReserveGoldStartBalance**: *function* = proxyCall(
    this.contract.methods.frozenReserveGoldStartBalance,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/Reserve.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L31)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  frozenReserveGoldStartDay

• **frozenReserveGoldStartDay**: *function* = proxyCall(
    this.contract.methods.frozenReserveGoldStartDay,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/Reserve.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L36)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getOrComputeTobinTax

• **getOrComputeTobinTax**: *function* = proxySend(this.kit, this.contract.methods.getOrComputeTobinTax)

*Defined in [packages/contractkit/src/wrappers/Reserve.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L30)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getOtherReserveAddresses

• **getOtherReserveAddresses**: *function* = proxyCall(this.contract.methods.getOtherReserveAddresses)

*Defined in [packages/contractkit/src/wrappers/Reserve.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L51)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getReserveGoldBalance

• **getReserveGoldBalance**: *function* = proxyCall(
    this.contract.methods.getReserveGoldBalance,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/Reserve.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L46)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isOtherReserveAddress

• **isOtherReserveAddress**: *function* = proxyCall(this.contract.methods.isOtherReserveAddress)

*Defined in [packages/contractkit/src/wrappers/Reserve.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L66)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isSpender

• **isSpender**: *function* = proxyCall(this.contract.methods.isSpender)

*Defined in [packages/contractkit/src/wrappers/Reserve.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L28)*

#### Type declaration:

▸ (`account`: string): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

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

###  tobinTaxStalenessThreshold

• **tobinTaxStalenessThreshold**: *function* = proxyCall(
    this.contract.methods.tobinTaxStalenessThreshold,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/Reserve.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L23)*

Query Tobin tax staleness threshold parameter.

**`returns`** Current Tobin tax staleness threshold.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  transferGold

• **transferGold**: *function* = proxySend(this.kit, this.contract.methods.transferGold)

*Defined in [packages/contractkit/src/wrappers/Reserve.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L29)*

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

###  getConfig

▸ **getConfig**(): *Promise‹[ReserveConfig](../interfaces/_wrappers_reserve_.reserveconfig.md)›*

*Defined in [packages/contractkit/src/wrappers/Reserve.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L56)*

Returns current configuration parameters.

**Returns:** *Promise‹[ReserveConfig](../interfaces/_wrappers_reserve_.reserveconfig.md)›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹Reserve›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹Reserve› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getSpenders

▸ **getSpenders**(): *Promise‹[Address](../modules/_base_.md#address)[]›*

*Defined in [packages/contractkit/src/wrappers/Reserve.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L68)*

**Returns:** *Promise‹[Address](../modules/_base_.md#address)[]›*
