# DoubleSigningSlasherWrapper

Contract handling slashing for Validator double-signing

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹DoubleSigningSlasher›

  ↳ **DoubleSigningSlasherWrapper**

## Index

### Constructors

* [constructor](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#constructor)

### Properties

* [events](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#events)
* [slashingIncentives](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#slashingincentives)

### Accessors

* [address](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#address)

### Methods

* [getBlockNumberFromHeader](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#getblocknumberfromheader)
* [slashSigner](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#slashsigner)
* [slashValidator](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#slashvalidator)

## Constructors

### constructor

+ **new DoubleSigningSlasherWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: DoubleSigningSlasher\): [_DoubleSigningSlasherWrapper_](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | DoubleSigningSlasher |

**Returns:** [_DoubleSigningSlasherWrapper_](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)

## Properties

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### slashingIncentives

• **slashingIncentives**: _function_ = proxyCall\(this.contract.methods.slashingIncentives, undefined, \(res\): { reward: BigNumber penalty: BigNumber } =&gt; \({ reward: valueToBigNumber\(res.reward\), penalty: valueToBigNumber\(res.penalty\), }\)\)

_Defined in_ [_contractkit/src/wrappers/DoubleSigningSlasher.ts:22_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L22)

Returns slashing incentives.

**`returns`** Rewards and penaltys for slashing.

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### getBlockNumberFromHeader

▸ **getBlockNumberFromHeader**\(`header`: string\): _Promise‹number›_

_Defined in_ [_contractkit/src/wrappers/DoubleSigningSlasher.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L35)

Parses block number out of header.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `header` | string | RLP encoded header |

**Returns:** _Promise‹number›_

Block number.

### slashSigner

▸ **slashSigner**\(`signerAddress`: [Address](../external-modules/_base_.md#address), `headerA`: string, `headerB`: string\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

_Defined in_ [_contractkit/src/wrappers/DoubleSigningSlasher.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L68)

Slash a Validator for double-signing.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signerAddress` | [Address](../external-modules/_base_.md#address) | - |
| `headerA` | string | First double signed block header. |
| `headerB` | string | Second double signed block header. |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

### slashValidator

▸ **slashValidator**\(`validatorAddress`: [Address](../external-modules/_base_.md#address), `headerA`: string, `headerB`: string\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

_Defined in_ [_contractkit/src/wrappers/DoubleSigningSlasher.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L46)

Slash a Validator for double-signing.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validatorAddress` | [Address](../external-modules/_base_.md#address) | - |
| `headerA` | string | First double signed block header. |
| `headerB` | string | Second double signed block header. |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

