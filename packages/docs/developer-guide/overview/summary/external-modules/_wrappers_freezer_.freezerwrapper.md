# FreezerWrapper

## Hierarchy

* [BaseWrapper]()‹Freezer›

  ↳ **FreezerWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [events]()
* [freeze]()
* [isFrozen]()
* [unfreeze]()

### Accessors

* [address]()

## Constructors

### constructor

+ **new FreezerWrapper**\(`kit`: [ContractKit](), `contract`: Freezer\): [_FreezerWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Freezer |

**Returns:** [_FreezerWrapper_]()

## Properties

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### freeze

• **freeze**: _function_ = proxySend\(this.kit, this.contract.methods.freeze\)

_Defined in_ [_contractkit/src/wrappers/Freezer.ts:5_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Freezer.ts#L5)

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isFrozen

• **isFrozen**: _function_ = proxyCall\(this.contract.methods.isFrozen\)

_Defined in_ [_contractkit/src/wrappers/Freezer.ts:7_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Freezer.ts#L7)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### unfreeze

• **unfreeze**: _function_ = proxySend\(this.kit, this.contract.methods.unfreeze\)

_Defined in_ [_contractkit/src/wrappers/Freezer.ts:6_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Freezer.ts#L6)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

