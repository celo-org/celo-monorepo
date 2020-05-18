# DoubleSigningSlasherWrapper

Contract handling slashing for Validator double-signing

## Hierarchy

* [BaseWrapper]()‹DoubleSigningSlasher›

  ↳ **DoubleSigningSlasherWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [events]()
* [slashingIncentives]()

### Accessors

* [address]()

### Methods

* [getBlockNumberFromHeader]()
* [slashSigner]()
* [slashValidator]()

## Constructors

### constructor

+ **new DoubleSigningSlasherWrapper**\(`kit`: [ContractKit](), `contract`: DoubleSigningSlasher\): [_DoubleSigningSlasherWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | DoubleSigningSlasher |

**Returns:** [_DoubleSigningSlasherWrapper_]()

## Properties

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

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

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

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

▸ **slashSigner**\(`signerAddress`: [Address](_base_.md#address), `headerA`: string, `headerB`: string\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_contractkit/src/wrappers/DoubleSigningSlasher.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L68)

Slash a Validator for double-signing.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signerAddress` | [Address](_base_.md#address) | - |
| `headerA` | string | First double signed block header. |
| `headerB` | string | Second double signed block header. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

### slashValidator

▸ **slashValidator**\(`validatorAddress`: [Address](_base_.md#address), `headerA`: string, `headerB`: string\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_contractkit/src/wrappers/DoubleSigningSlasher.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L46)

Slash a Validator for double-signing.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validatorAddress` | [Address](_base_.md#address) | - |
| `headerA` | string | First double signed block header. |
| `headerB` | string | Second double signed block header. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

