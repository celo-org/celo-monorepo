# DoubleSigningSlasherWrapper

Contract handling slashing for Validator double-signing

## Hierarchy

↳ [BaseSlasher]()‹DoubleSigningSlasher›

↳ **DoubleSigningSlasherWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [eventTypes]()
* [events]()
* [methodIds]()
* [slashingIncentives]()

### Accessors

* [address]()

### Methods

* [getBlockNumberFromHeader]()
* [getPastEvents]()
* [slashSigner]()
* [slashValidator]()

## Constructors

### constructor

+ **new DoubleSigningSlasherWrapper**\(`kit`: [ContractKit](), `contract`: DoubleSigningSlasher\): [_DoubleSigningSlasherWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | DoubleSigningSlasher |

**Returns:** [_DoubleSigningSlasherWrapper_]()

## Properties

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _DoubleSigningSlasher\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

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

### slashingIncentives

• **slashingIncentives**: _function_ = proxyCall\( this.contract.methods.slashingIncentives, undefined, \(res\) =&gt; \({ reward: valueToBigNumber\(res.reward\), penalty: valueToBigNumber\(res.penalty\), }\) \)

_Inherited from_ [_BaseSlasher_]()_._[_slashingIncentives_]()

_Defined in_ [_contractkit/src/wrappers/BaseSlasher.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseSlasher.ts#L69)

Returns slashing incentives.

**`returns`** Rewards and penalties for slashing.

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

### getBlockNumberFromHeader

▸ **getBlockNumberFromHeader**\(`header`: string\): _Promise‹number›_

_Defined in_ [_contractkit/src/wrappers/DoubleSigningSlasher.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DoubleSigningSlasher.ts#L15)

Parses block number out of header.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `header` | string | RLP encoded header |

**Returns:** _Promise‹number›_

Block number.

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹DoubleSigningSlasher›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹DoubleSigningSlasher› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### slashSigner

▸ **slashSigner**\(`signerAddress`: Address, `headerA`: string, `headerB`: string\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/DoubleSigningSlasher.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DoubleSigningSlasher.ts#L38)

Slash a Validator signer for double-signing.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signerAddress` | Address | - |
| `headerA` | string | First double signed block header. |
| `headerB` | string | Second double signed block header. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

### slashValidator

▸ **slashValidator**\(`validatorAddress`: Address, `headerA`: string, `headerB`: string\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/DoubleSigningSlasher.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/DoubleSigningSlasher.ts#L26)

Slash a Validator for double-signing.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validatorAddress` | Address | Validator to slash. |
| `headerA` | string | First double signed block header. |
| `headerB` | string | Second double signed block header. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

