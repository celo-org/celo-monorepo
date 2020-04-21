# Class: EpochRewardsWrapper

Contract for handling reserve for stable currencies

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹EpochRewards›

  ↳ **EpochRewardsWrapper**

## Index

### Constructors

* [constructor](_wrappers_epochrewardswrapper_.epochrewardswrapper.md#constructor)

### Properties

* [events](_wrappers_epochrewardswrapper_.epochrewardswrapper.md#events)
* [getRewardsMultiplier](_wrappers_epochrewardswrapper_.epochrewardswrapper.md#getrewardsmultiplier)
* [getTargetGoldTotalSupply](_wrappers_epochrewardswrapper_.epochrewardswrapper.md#gettargetgoldtotalsupply)

### Accessors

* [address](_wrappers_epochrewardswrapper_.epochrewardswrapper.md#address)

### Methods

* [exists](_wrappers_epochrewardswrapper_.epochrewardswrapper.md#exists)
* [setDefaultBlock](_wrappers_epochrewardswrapper_.epochrewardswrapper.md#setdefaultblock)

## Constructors

###  constructor

\+ **new EpochRewardsWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: EpochRewards): *[EpochRewardsWrapper](_wrappers_epochrewardswrapper_.epochrewardswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | EpochRewards |

**Returns:** *[EpochRewardsWrapper](_wrappers_epochrewardswrapper_.epochrewardswrapper.md)*

## Properties

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  getRewardsMultiplier

• **getRewardsMultiplier**: *function* = proxyCall(this.contract.methods.getRewardsMultiplier)

*Defined in [contractkit/src/wrappers/EpochRewardsWrapper.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/EpochRewardsWrapper.ts#L8)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getTargetGoldTotalSupply

• **getTargetGoldTotalSupply**: *function* = proxyCall(this.contract.methods.getTargetGoldTotalSupply)

*Defined in [contractkit/src/wrappers/EpochRewardsWrapper.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/EpochRewardsWrapper.ts#L10)*

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

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  exists

▸ **exists**(`block?`: undefined | number): *Promise‹boolean›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[exists](_wrappers_basewrapper_.basewrapper.md#exists)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`block?` | undefined &#124; number |

**Returns:** *Promise‹boolean›*

___

###  setDefaultBlock

▸ **setDefaultBlock**(`block`: number | "latest"): *void*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[setDefaultBlock](_wrappers_basewrapper_.basewrapper.md#setdefaultblock)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`block` | number &#124; "latest" |

**Returns:** *void*
