# Class: MultiSigWrapper

Contract for handling multisig actions

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹MultiSig›

  ↳ **MultiSigWrapper**

  ↳ [GovernanceApproverMultiSigWrapper](_wrappers_governanceapprovermultisig_.governanceapprovermultisigwrapper.md)

  ↳ [ReserveSpenderMultiSigWrapper](_wrappers_reservespendermultisig_.reservespendermultisigwrapper.md)

## Index

### Constructors

* [constructor](_wrappers_multisig_.multisigwrapper.md#constructor)

### Properties

* [isowner](_wrappers_multisig_.multisigwrapper.md#isowner)

### Accessors

* [address](_wrappers_multisig_.multisigwrapper.md#address)

### Methods

* [submitOrConfirmTransaction](_wrappers_multisig_.multisigwrapper.md#submitorconfirmtransaction)

## Constructors

###  constructor

\+ **new MultiSigWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: MultiSig): *[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | MultiSig |

**Returns:** *[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)*

## Properties

###  isowner

• **isowner**: *function* = proxyCall(this.contract.methods.isOwner)

*Defined in [contractkit/src/wrappers/MultiSig.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L35)*

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

*Defined in [contractkit/src/wrappers/MultiSig.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L14)*

Allows an owner to submit and confirm a transaction.

**Parameters:**

Name | Type |
------ | ------ |
`destination` | string |
`txObject` | TransactionObject‹any› |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void› | [CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string››*
