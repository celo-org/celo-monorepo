# GasPriceMinimumWrapper

Stores the gas price minimum

## Hierarchy

* [BaseWrapper]()‹GasPriceMinimum›

  ↳ **GasPriceMinimumWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [adjustmentSpeed]()
* [events]()
* [gasPriceMinimum]()
* [getGasPriceMinimum]()
* [targetDensity]()

### Accessors

* [address]()

### Methods

* [getConfig]()

## Constructors

### constructor

+ **new GasPriceMinimumWrapper**\(`kit`: [ContractKit](), `contract`: GasPriceMinimum\): [_GasPriceMinimumWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | GasPriceMinimum |

**Returns:** [_GasPriceMinimumWrapper_]()

## Properties

### adjustmentSpeed

• **adjustmentSpeed**: _function_ = proxyCall\( this.contract.methods.adjustmentSpeed, undefined, fixidityValueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L44)

Query adjustment speed parameter

**`returns`** multiplier that impacts how quickly gas price minimum is adjusted.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### gasPriceMinimum

• **gasPriceMinimum**: _function_ = proxyCall\(this.contract.methods.gasPriceMinimum, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L19)

Query current gas price minimum in gGLD.

**`returns`** current gas price minimum in cGLD

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getGasPriceMinimum

• **getGasPriceMinimum**: _function_ = proxyCall\( this.contract.methods.getGasPriceMinimum, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L25)

Query current gas price minimum.

**`returns`** current gas price minimum in the requested currency

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### targetDensity

• **targetDensity**: _function_ = proxyCall\( this.contract.methods.targetDensity, undefined, fixidityValueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L35)

Query target density parameter.

**`returns`** the current block density targeted by the gas price minimum algorithm.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### getConfig

▸ **getConfig**\(\): _Promise‹_[_GasPriceMinimumConfig_]()_›_

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GasPriceMinimum.ts#L52)

Returns current configuration parameters.

**Returns:** _Promise‹_[_GasPriceMinimumConfig_]()_›_

