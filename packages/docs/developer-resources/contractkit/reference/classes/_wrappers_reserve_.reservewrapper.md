# Class: ReserveWrapper

Contract for handling reserve for stable currencies

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Reserve›

  ↳ **ReserveWrapper**

## Index

### Constructors

* [constructor](_wrappers_reserve_.reservewrapper.md#constructor)

### Properties

* [getOrComputeTobinTax](_wrappers_reserve_.reservewrapper.md#getorcomputetobintax)
* [isOtherReserveAddress](_wrappers_reserve_.reservewrapper.md#isotherreserveaddress)
* [isSpender](_wrappers_reserve_.reservewrapper.md#isspender)
* [tobinTaxStalenessThreshold](_wrappers_reserve_.reservewrapper.md#tobintaxstalenessthreshold)
* [transferGold](_wrappers_reserve_.reservewrapper.md#transfergold)

### Accessors

* [address](_wrappers_reserve_.reservewrapper.md#address)

### Methods

* [getConfig](_wrappers_reserve_.reservewrapper.md#getconfig)
* [getSpenders](_wrappers_reserve_.reservewrapper.md#getspenders)

## Constructors

###  constructor

\+ **new ReserveWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Reserve): *[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Reserve |

**Returns:** *[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)*

## Properties

###  getOrComputeTobinTax

• **getOrComputeTobinTax**: *function* = proxySend(this.kit, this.contract.methods.getOrComputeTobinTax)

*Defined in [contractkit/src/wrappers/Reserve.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L26)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isOtherReserveAddress

• **isOtherReserveAddress**: *function* = proxyCall(this.contract.methods.isOtherReserveAddress)

*Defined in [contractkit/src/wrappers/Reserve.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L37)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isSpender

• **isSpender**: *function* = proxyCall(this.contract.methods.isSpender)

*Defined in [contractkit/src/wrappers/Reserve.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L24)*

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

*Defined in [contractkit/src/wrappers/Reserve.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L19)*

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

*Defined in [contractkit/src/wrappers/Reserve.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L25)*

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

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  getConfig

▸ **getConfig**(): *Promise‹[ReserveConfig](../interfaces/_wrappers_reserve_.reserveconfig.md)›*

*Defined in [contractkit/src/wrappers/Reserve.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L31)*

Returns current configuration parameters.

**Returns:** *Promise‹[ReserveConfig](../interfaces/_wrappers_reserve_.reserveconfig.md)›*

___

###  getSpenders

▸ **getSpenders**(): *Promise‹[Address](../modules/_base_.md#address)[]›*

*Defined in [contractkit/src/wrappers/Reserve.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L39)*

**Returns:** *Promise‹[Address](../modules/_base_.md#address)[]›*
