# ReserveWrapper

Contract for handling reserve for stable currencies

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Reserve›

  ↳ **ReserveWrapper**

## Index

### Constructors

* [constructor](_wrappers_reserve_.reservewrapper.md#constructor)

### Properties

* [events](_wrappers_reserve_.reservewrapper.md#events)
* [frozenReserveGoldDays](_wrappers_reserve_.reservewrapper.md#frozenreservegolddays)
* [frozenReserveGoldStartBalance](_wrappers_reserve_.reservewrapper.md#frozenreservegoldstartbalance)
* [frozenReserveGoldStartDay](_wrappers_reserve_.reservewrapper.md#frozenreservegoldstartday)
* [getOrComputeTobinTax](_wrappers_reserve_.reservewrapper.md#getorcomputetobintax)
* [getOtherReserveAddresses](_wrappers_reserve_.reservewrapper.md#getotherreserveaddresses)
* [getReserveGoldBalance](_wrappers_reserve_.reservewrapper.md#getreservegoldbalance)
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

### constructor

+ **new ReserveWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Reserve\): [_ReserveWrapper_](_wrappers_reserve_.reservewrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | Reserve |

**Returns:** [_ReserveWrapper_](_wrappers_reserve_.reservewrapper.md)

## Properties

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### frozenReserveGoldDays

• **frozenReserveGoldDays**: _function_ = proxyCall\( this.contract.methods.frozenReserveGoldDays, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L41)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### frozenReserveGoldStartBalance

• **frozenReserveGoldStartBalance**: _function_ = proxyCall\( this.contract.methods.frozenReserveGoldStartBalance, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:31_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L31)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### frozenReserveGoldStartDay

• **frozenReserveGoldStartDay**: _function_ = proxyCall\( this.contract.methods.frozenReserveGoldStartDay, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L36)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getOrComputeTobinTax

• **getOrComputeTobinTax**: _function_ = proxySend\(this.kit, this.contract.methods.getOrComputeTobinTax\)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L30)

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getOtherReserveAddresses

• **getOtherReserveAddresses**: _function_ = proxyCall\(this.contract.methods.getOtherReserveAddresses\)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L51)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getReserveGoldBalance

• **getReserveGoldBalance**: _function_ = proxyCall\( this.contract.methods.getReserveGoldBalance, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L46)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isOtherReserveAddress

• **isOtherReserveAddress**: _function_ = proxyCall\(this.contract.methods.isOtherReserveAddress\)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:66_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L66)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isSpender

• **isSpender**: _function_ = proxyCall\(this.contract.methods.isSpender\)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L28)

#### Type declaration:

▸ \(`account`: string\): _Promise‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

### tobinTaxStalenessThreshold

• **tobinTaxStalenessThreshold**: _function_ = proxyCall\( this.contract.methods.tobinTaxStalenessThreshold, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L23)

Query Tobin tax staleness threshold parameter.

**`returns`** Current Tobin tax staleness threshold.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### transferGold

• **transferGold**: _function_ = proxySend\(this.kit, this.contract.methods.transferGold\)

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L29)

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### getConfig

▸ **getConfig**\(\): _Promise‹_[_ReserveConfig_](../interfaces/_wrappers_reserve_.reserveconfig.md)_›_

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L56)

Returns current configuration parameters.

**Returns:** _Promise‹_[_ReserveConfig_](../interfaces/_wrappers_reserve_.reserveconfig.md)_›_

### getSpenders

▸ **getSpenders**\(\): _Promise‹_[_Address_](../external-modules/_base_.md#address)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Reserve.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L68)

**Returns:** _Promise‹_[_Address_](../external-modules/_base_.md#address)_\[\]›_

