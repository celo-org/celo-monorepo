# Class: ReserveWrapper

Contract for handling reserve for stable currencies

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Reserve›

  ↳ **ReserveWrapper**

## Index

### Constructors

* [constructor](_wrappers_reserve_.reservewrapper.md#constructor)

### Properties

* [tobinTaxStalenessThreshold](_wrappers_reserve_.reservewrapper.md#tobintaxstalenessthreshold)

### Accessors

* [address](_wrappers_reserve_.reservewrapper.md#address)

### Methods

* [getConfig](_wrappers_reserve_.reservewrapper.md#getconfig)
* [isSpender](_wrappers_reserve_.reservewrapper.md#isspender)
* [transferGold](_wrappers_reserve_.reservewrapper.md#transfergold)

## Constructors

###  constructor

\+ **new ReserveWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Reserve): *[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Reserve |

**Returns:** *[ReserveWrapper](_wrappers_reserve_.reservewrapper.md)*

## Properties

###  tobinTaxStalenessThreshold

• **tobinTaxStalenessThreshold**: *function* = proxyCall(
    this.contract.methods.tobinTaxStalenessThreshold,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Reserve.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L24)*

Query Tobin tax staleness threshold parameter.

**`returns`** Current Tobin tax staleness threshold.

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

###  getConfig

▸ **getConfig**(): *Promise‹[ReserveConfig](../interfaces/_wrappers_reserve_.reserveconfig.md)›*

*Defined in [contractkit/src/wrappers/Reserve.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L53)*

Returns current configuration parameters.

**Returns:** *Promise‹[ReserveConfig](../interfaces/_wrappers_reserve_.reserveconfig.md)›*

___

###  isSpender

▸ **isSpender**(`account`: [Address](../modules/_base_.md#address)): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/Reserve.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L36)*

Check is spender is a signatory of the multiSig spender address
TODO @amyslawson update this if we decide to continue to support other
non-multisig spenders

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_base_.md#address) |   |

**Returns:** *Promise‹boolean›*

___

###  transferGold

▸ **transferGold**(`to`: [Address](../modules/_base_.md#address), `value`: BigNumber.Value): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string››*

*Defined in [contractkit/src/wrappers/Reserve.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Reserve.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`to` | [Address](../modules/_base_.md#address) |
`value` | BigNumber.Value |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string››*
