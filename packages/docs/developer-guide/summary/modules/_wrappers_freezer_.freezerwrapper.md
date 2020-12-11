# FreezerWrapper

## Hierarchy

* [BaseWrapper]()‹Freezer›

  ↳ **FreezerWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [eventTypes]()
* [events]()
* [freeze]()
* [isFrozen]()
* [methodIds]()
* [unfreeze]()

### Accessors

* [address]()

### Methods

* [getPastEvents]()

## Constructors

### constructor

+ **new FreezerWrapper**\(`kit`: [ContractKit](), `contract`: Freezer\): [_FreezerWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Freezer |

**Returns:** [_FreezerWrapper_]()

## Properties

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)

### events

• **events**: _Freezer\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)

### freeze

• **freeze**: _function_ = proxySend\(this.kit, this.contract.methods.freeze\)

_Defined in_ [_packages/contractkit/src/wrappers/Freezer.ts:5_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Freezer.ts#L5)

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

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

_Inherited from_ [_BaseWrapper_]()_._[_methodIds_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)

### unfreeze

• **unfreeze**: _function_ = proxySend\(this.kit, this.contract.methods.unfreeze\)

_Defined in_ [_packages/contractkit/src/wrappers/Freezer.ts:6_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Freezer.ts#L6)

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Freezer›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Freezer› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

