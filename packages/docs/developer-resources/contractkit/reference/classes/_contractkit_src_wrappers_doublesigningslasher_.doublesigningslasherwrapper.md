# Class: DoubleSigningSlasherWrapper

Contract handling slashing for Validator double-signing

## Hierarchy

* [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)‹DoubleSigningSlasher›

  ↳ **DoubleSigningSlasherWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#constructor)

### Properties

* [events](_contractkit_src_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#events)
* [slashingIncentives](_contractkit_src_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#slashingincentives)

### Accessors

* [address](_contractkit_src_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#address)

### Methods

* [getBlockNumberFromHeader](_contractkit_src_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#getblocknumberfromheader)
* [slashSigner](_contractkit_src_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#slashsigner)
* [slashValidator](_contractkit_src_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#slashvalidator)

## Constructors

###  constructor

\+ **new DoubleSigningSlasherWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: DoubleSigningSlasher): *[DoubleSigningSlasherWrapper](_contractkit_src_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | DoubleSigningSlasher |

**Returns:** *[DoubleSigningSlasherWrapper](_contractkit_src_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)*

## Properties

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[events](_contractkit_src_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  slashingIncentives

• **slashingIncentives**: *function* = proxyCall(this.contract.methods.slashingIncentives, undefined, (res): {
    reward: BigNumber
    penalty: BigNumber
  } => ({
    reward: valueToBigNumber(res.reward),
    penalty: valueToBigNumber(res.penalty),
  }))

*Defined in [contractkit/src/wrappers/DoubleSigningSlasher.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L22)*

Returns slashing incentives.

**`returns`** Rewards and penaltys for slashing.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[address](_contractkit_src_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  getBlockNumberFromHeader

▸ **getBlockNumberFromHeader**(`header`: string): *Promise‹number›*

*Defined in [contractkit/src/wrappers/DoubleSigningSlasher.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L35)*

Parses block number out of header.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`header` | string | RLP encoded header |

**Returns:** *Promise‹number›*

Block number.

___

###  slashSigner

▸ **slashSigner**(`signerAddress`: [Address](../modules/_contractkit_src_base_.md#address), `headerA`: string, `headerB`: string): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/DoubleSigningSlasher.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L68)*

Slash a Validator for double-signing.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signerAddress` | [Address](../modules/_contractkit_src_base_.md#address) | - |
`headerA` | string | First double signed block header. |
`headerB` | string | Second double signed block header.  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  slashValidator

▸ **slashValidator**(`validatorAddress`: [Address](../modules/_contractkit_src_base_.md#address), `headerA`: string, `headerB`: string): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/DoubleSigningSlasher.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L46)*

Slash a Validator for double-signing.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorAddress` | [Address](../modules/_contractkit_src_base_.md#address) | - |
`headerA` | string | First double signed block header. |
`headerB` | string | Second double signed block header.  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*
