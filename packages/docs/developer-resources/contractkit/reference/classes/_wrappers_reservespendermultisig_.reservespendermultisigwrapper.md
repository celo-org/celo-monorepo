# Class: ReserveSpenderMultiSigWrapper

Contract for handling multisig goverance approvar actions

## Hierarchy

  ↳ [MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)

  ↳ **ReserveSpenderMultiSigWrapper**

## Index

### Constructors

* [constructor](_wrappers_reservespendermultisig_.reservespendermultisigwrapper.md#constructor)

### Properties

* [isowner](_wrappers_reservespendermultisig_.reservespendermultisigwrapper.md#isowner)

### Accessors

* [address](_wrappers_reservespendermultisig_.reservespendermultisigwrapper.md#address)

### Methods

* [submitOrConfirmTransaction](_wrappers_reservespendermultisig_.reservespendermultisigwrapper.md#submitorconfirmtransaction)

## Constructors

###  constructor

\+ **new ReserveSpenderMultiSigWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: MultiSig): *[ReserveSpenderMultiSigWrapper](_wrappers_reservespendermultisig_.reservespendermultisigwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | MultiSig |

**Returns:** *[ReserveSpenderMultiSigWrapper](_wrappers_reservespendermultisig_.reservespendermultisigwrapper.md)*

## Properties

###  isowner

• **isowner**: *function* = proxyCall(this.contract.methods.isOwner)

*Inherited from [MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md).[isowner](_wrappers_multisig_.multisigwrapper.md#isowner)*

*Defined in [contractkit/src/wrappers/MultiSig.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L40)*

#### Type declaration:

▸ (`owner`: [Address](../modules/_base_.md#address)): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`owner` | [Address](../modules/_base_.md#address) |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

Contract address

**Returns:** *string*

## Methods

###  submitOrConfirmTransaction

▸ **submitOrConfirmTransaction**(`destination`: string, `txObject`: TransactionObject‹any›): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void› | [CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string››*

*Inherited from [MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md).[submitOrConfirmTransaction](_wrappers_multisig_.multisigwrapper.md#submitorconfirmtransaction)*

*Defined in [contractkit/src/wrappers/MultiSig.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L19)*

Allows an owner to submit and confirm a transaction.

**Parameters:**

Name | Type |
------ | ------ |
`destination` | string |
`txObject` | TransactionObject‹any› |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void› | [CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string››*
