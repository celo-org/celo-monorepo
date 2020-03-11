# Class: DoubleSigningSlasherWrapper

Contract handling slashing for Validator double-signing

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹DoubleSigningSlasher›

  ↳ **DoubleSigningSlasherWrapper**

## Index

### Constructors

* [constructor](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#constructor)

### Properties

* [slashingIncentives](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#slashingincentives)

### Accessors

* [address](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#address)

### Methods

* [getBlockNumberFromHeader](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#getblocknumberfromheader)
* [slashSigner](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#slashsigner)
* [slashValidator](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md#slashvalidator)

## Constructors

###  constructor

\+ **new DoubleSigningSlasherWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: DoubleSigningSlasher): *[DoubleSigningSlasherWrapper](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | DoubleSigningSlasher |

**Returns:** *[DoubleSigningSlasherWrapper](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)*

## Properties

###  slashingIncentives

• **slashingIncentives**: *function* = proxyCall(this.contract.methods.slashingIncentives, undefined, (res): {
    reward: BigNumber
    penalty: BigNumber
  } => ({
    reward: valueToBigNumber(res.reward),
    penalty: valueToBigNumber(res.penalty),
  }))

*Defined in [contractkit/src/wrappers/DoubleSigningSlasher.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L23)*

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

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

Contract address

**Returns:** *string*

## Methods

###  getBlockNumberFromHeader

▸ **getBlockNumberFromHeader**(`header`: string): *Promise‹number›*

*Defined in [contractkit/src/wrappers/DoubleSigningSlasher.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L36)*

Parses block number out of header.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`header` | string | RLP encoded header |

**Returns:** *Promise‹number›*

Block number.

___

###  slashSigner

▸ **slashSigner**(`signerAddress`: [Address](../modules/_base_.md#address), `headerA`: string, `headerB`: string): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/DoubleSigningSlasher.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L69)*

Slash a Validator for double-signing.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signerAddress` | [Address](../modules/_base_.md#address) | - |
`headerA` | string | First double signed block header. |
`headerB` | string | Second double signed block header.  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  slashValidator

▸ **slashValidator**(`validatorAddress`: [Address](../modules/_base_.md#address), `headerA`: string, `headerB`: string): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/DoubleSigningSlasher.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L47)*

Slash a Validator for double-signing.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorAddress` | [Address](../modules/_base_.md#address) | - |
`headerA` | string | First double signed block header. |
`headerB` | string | Second double signed block header.  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*
