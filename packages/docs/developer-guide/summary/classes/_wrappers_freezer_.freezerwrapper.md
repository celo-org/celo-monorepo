# FreezerWrapper

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

### constructor

+ **new FreezerWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Freezer\): [_FreezerWrapper_](_wrappers_freezer_.freezerwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | Freezer |

**Returns:** [_FreezerWrapper_](_wrappers_freezer_.freezerwrapper.md)

## Properties

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_eventTypes_](_wrappers_basewrapper_.basewrapper.md#eventtypes)

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)

### events

• **events**: _Freezer\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)

### freeze

• **freeze**: _function_ = proxySend\(this.kit, this.contract.methods.freeze\)

_Defined in_ [_packages/contractkit/src/wrappers/Freezer.ts:5_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Freezer.ts#L5)

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isFrozen

• **isFrozen**: _function_ = proxyCall\(this.contract.methods.isFrozen\)

_Defined in_ [_packages/contractkit/src/wrappers/Freezer.ts:7_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Freezer.ts#L7)

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
    methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_methodIds_](_wrappers_basewrapper_.basewrapper.md#methodids)

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)

### unfreeze

• **unfreeze**: _function_ = proxySend\(this.kit, this.contract.methods.unfreeze\)

_Defined in_ [_packages/contractkit/src/wrappers/Freezer.ts:6_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Freezer.ts#L6)

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

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Freezer›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_getPastEvents_](_wrappers_basewrapper_.basewrapper.md#getpastevents)

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Freezer› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

