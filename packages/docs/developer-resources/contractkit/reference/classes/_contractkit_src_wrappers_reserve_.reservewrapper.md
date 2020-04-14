# Class: ReserveWrapper

Contract for handling reserve for stable currencies

## Hierarchy

* [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)‹Reserve›

  ↳ **ReserveWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_reserve_.reservewrapper.md#constructor)

### Properties

* [events](_contractkit_src_wrappers_reserve_.reservewrapper.md#events)
* [frozenReserveGoldDays](_contractkit_src_wrappers_reserve_.reservewrapper.md#frozenreservegolddays)
* [frozenReserveGoldStartBalance](_contractkit_src_wrappers_reserve_.reservewrapper.md#frozenreservegoldstartbalance)
* [frozenReserveGoldStartDay](_contractkit_src_wrappers_reserve_.reservewrapper.md#frozenreservegoldstartday)
* [getOrComputeTobinTax](_contractkit_src_wrappers_reserve_.reservewrapper.md#getorcomputetobintax)
* [getOtherReserveAddresses](_contractkit_src_wrappers_reserve_.reservewrapper.md#getotherreserveaddresses)
* [getReserveGoldBalance](_contractkit_src_wrappers_reserve_.reservewrapper.md#getreservegoldbalance)
* [isOtherReserveAddress](_contractkit_src_wrappers_reserve_.reservewrapper.md#isotherreserveaddress)
* [isSpender](_contractkit_src_wrappers_reserve_.reservewrapper.md#isspender)
* [tobinTaxStalenessThreshold](_contractkit_src_wrappers_reserve_.reservewrapper.md#tobintaxstalenessthreshold)
* [transferGold](_contractkit_src_wrappers_reserve_.reservewrapper.md#transfergold)

### Accessors

* [address](_contractkit_src_wrappers_reserve_.reservewrapper.md#address)

### Methods

* [getConfig](_contractkit_src_wrappers_reserve_.reservewrapper.md#getconfig)
* [getSpenders](_contractkit_src_wrappers_reserve_.reservewrapper.md#getspenders)

## Constructors

###  constructor

\+ **new ReserveWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: Reserve): *[ReserveWrapper](_contractkit_src_wrappers_reserve_.reservewrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | Reserve |

**Returns:** *[ReserveWrapper](_contractkit_src_wrappers_reserve_.reservewrapper.md)*

## Properties

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[events](_contractkit_src_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  frozenReserveGoldDays

• **frozenReserveGoldDays**: *function* = proxyCall(
    this.contract.methods.frozenReserveGoldDays,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Reserve.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L41)*

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

*Defined in [contractkit/src/wrappers/Reserve.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L31)*

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

*Defined in [contractkit/src/wrappers/Reserve.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L36)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getOrComputeTobinTax

• **getOrComputeTobinTax**: *function* = proxySend(this.kit, this.contract.methods.getOrComputeTobinTax)

*Defined in [contractkit/src/wrappers/Reserve.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L30)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getOtherReserveAddresses

• **getOtherReserveAddresses**: *function* = proxyCall(this.contract.methods.getOtherReserveAddresses)

*Defined in [contractkit/src/wrappers/Reserve.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L51)*

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

*Defined in [contractkit/src/wrappers/Reserve.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L46)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isOtherReserveAddress

• **isOtherReserveAddress**: *function* = proxyCall(this.contract.methods.isOtherReserveAddress)

*Defined in [contractkit/src/wrappers/Reserve.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L66)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isSpender

• **isSpender**: *function* = proxyCall(this.contract.methods.isSpender)

*Defined in [contractkit/src/wrappers/Reserve.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L28)*

#### Type declaration:

▸ (`account`: string): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

___

###  tobinTaxStalenessThreshold

• **tobinTaxStalenessThreshold**: *function* = proxyCall(
    this.contract.methods.tobinTaxStalenessThreshold,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Reserve.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L23)*

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

*Defined in [contractkit/src/wrappers/Reserve.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L29)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

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

▸ **getConfig**(): *Promise‹[ReserveConfig](../interfaces/_contractkit_src_wrappers_reserve_.reserveconfig.md)›*

*Defined in [contractkit/src/wrappers/Reserve.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L56)*

Returns current configuration parameters.

**Returns:** *Promise‹[ReserveConfig](../interfaces/_contractkit_src_wrappers_reserve_.reserveconfig.md)›*

___

###  getSpenders

▸ **getSpenders**(): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

*Defined in [contractkit/src/wrappers/Reserve.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L68)*

**Returns:** *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*
