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
* [eventTypes]()
* [events]()
* [gasPriceMinimum]()
* [getGasPriceMinimum]()
* [methodIds]()
* [targetDensity]()

### Accessors

* [address]()

### Methods

* [getConfig]()
* [getPastEvents]()

## Constructors

### constructor

+ **new GasPriceMinimumWrapper**\(`kit`: [ContractKit](), `contract`: GasPriceMinimum\): [_GasPriceMinimumWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | GasPriceMinimum |

**Returns:** [_GasPriceMinimumWrapper_]()

## Properties

### adjustmentSpeed

• **adjustmentSpeed**: _function_ = proxyCall\( this.contract.methods.adjustmentSpeed, undefined, fixidityValueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L44)

Query adjustment speed parameter

**`returns`** multiplier that impacts how quickly gas price minimum is adjusted.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _GasPriceMinimum\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### gasPriceMinimum

• **gasPriceMinimum**: _function_ = proxyCall\(this.contract.methods.gasPriceMinimum, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L19)

Query current gas price minimum in CELO.

**`returns`** current gas price minimum in CELO

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getGasPriceMinimum

• **getGasPriceMinimum**: _function_ = proxyCall\( this.contract.methods.getGasPriceMinimum, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L25)

Query current gas price minimum.

**`returns`** current gas price minimum in the requested currency

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### methodIds

• **methodIds**: _Record‹keyof T\["methods"\], string›_ = Object.keys\(this.contract.methods\).reduce, string&gt;&gt;\( \(acc, method: Methods\) =&gt; { const methodABI = this.contract.options.jsonInterface.find\(\(item\) =&gt; item.name === method\)

```text
  acc[method] =
    methodABI === undefined
      ? '0x'
      : this.kit.connection.getAbiCoder().encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_]()_._[_methodIds_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)

### targetDensity

• **targetDensity**: _function_ = proxyCall\( this.contract.methods.targetDensity, undefined, fixidityValueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L35)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getConfig

▸ **getConfig**\(\): _Promise‹_[_GasPriceMinimumConfig_]()_›_

_Defined in_ [_contractkit/src/wrappers/GasPriceMinimum.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GasPriceMinimum.ts#L52)

Returns current configuration parameters.

**Returns:** _Promise‹_[_GasPriceMinimumConfig_]()_›_

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹GasPriceMinimum›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹GasPriceMinimum› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

