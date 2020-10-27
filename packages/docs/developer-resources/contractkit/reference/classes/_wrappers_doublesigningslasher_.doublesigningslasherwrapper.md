# Class: DoubleSigningSlasherWrapper

Contract handling slashing for Validator double-signing

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹DoubleSigningSlasher›

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

###  constructor

\+ **new DoubleSigningSlasherWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: DoubleSigningSlasher): *[DoubleSigningSlasherWrapper](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | DoubleSigningSlasher |

**Returns:** *[DoubleSigningSlasherWrapper](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)*

## Properties

###  eventTypes

• **eventTypes**: *object* = Object.keys(this.events).reduce<Record<Events<T>, Events<T>>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L38)*

#### Type declaration:

___

###  events

• **events**: *DoubleSigningSlasher["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)*

___

###  methodIds

• **methodIds**: *object* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L43)*

#### Type declaration:

___

###  slashingIncentives

• **slashingIncentives**: *function* = proxyCall(this.contract.methods.slashingIncentives, undefined, (res): {
    reward: BigNumber
    penalty: BigNumber
  } => ({
    reward: valueToBigNumber(res.reward),
    penalty: valueToBigNumber(res.penalty),
  }))

*Defined in [packages/contractkit/src/wrappers/DoubleSigningSlasher.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L22)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)*

Contract address

**Returns:** *string*

## Methods

###  getBlockNumberFromHeader

▸ **getBlockNumberFromHeader**(`header`: string): *Promise‹number›*

*Defined in [packages/contractkit/src/wrappers/DoubleSigningSlasher.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L35)*

Parses block number out of header.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`header` | string | RLP encoded header |

**Returns:** *Promise‹number›*

Block number.

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹DoubleSigningSlasher›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L32)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹DoubleSigningSlasher› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  slashSigner

▸ **slashSigner**(`signerAddress`: [Address](../modules/_base_.md#address), `headerA`: string, `headerB`: string): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/DoubleSigningSlasher.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L68)*

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

*Defined in [packages/contractkit/src/wrappers/DoubleSigningSlasher.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DoubleSigningSlasher.ts#L46)*

Slash a Validator for double-signing.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorAddress` | [Address](../modules/_base_.md#address) | - |
`headerA` | string | First double signed block header. |
`headerB` | string | Second double signed block header.  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*
