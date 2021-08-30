# DoubleSigningSlasherWrapper

Contract handling slashing for Validator double-signing

## Hierarchy

↳ [BaseSlasher](_wrappers_baseslasher_.baseslasher.md)‹DoubleSigningSlasher›

↳ **DoubleSigningSlasherWrapper**

## Index

### Constructors

* [constructor](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#constructor)

### Properties

* [eventTypes](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#eventtypes)
* [events](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#events)
* [methodIds](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#methodids)
* [slashingIncentives](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#slashingincentives)

### Accessors

* [address](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#address)

### Methods

* [getBlockNumberFromHeader](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#getblocknumberfromheader)
* [getPastEvents](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#getpastevents)
* [slashSigner](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#slashsigner)
* [slashValidator](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#slashvalidator)

## Constructors

### constructor

+ **new DoubleSigningSlasherWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: DoubleSigningSlasher\): [_DoubleSigningSlasherWrapper_](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | DoubleSigningSlasher |

**Returns:** [_DoubleSigningSlasherWrapper_](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)

## Properties

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_eventTypes_](_wrappers_basewrapper_.basewrapper.md#eventtypes)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _DoubleSigningSlasher\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

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

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_methodIds_](_wrappers_basewrapper_.basewrapper.md#methodids)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)

### slashingIncentives

• **slashingIncentives**: _function_ = proxyCall\( this.contract.methods.slashingIncentives, undefined, \(res\) =&gt; \({ reward: valueToBigNumber\(res.reward\), penalty: valueToBigNumber\(res.penalty\), }\) \)

_Inherited from_ [_BaseSlasher_](_wrappers_baseslasher_.baseslasher.md)_._[_slashingIncentives_](_wrappers_baseslasher_.baseslasher.md#slashingincentives)

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

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

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

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_getPastEvents_](_wrappers_basewrapper_.basewrapper.md#getpastevents)

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

