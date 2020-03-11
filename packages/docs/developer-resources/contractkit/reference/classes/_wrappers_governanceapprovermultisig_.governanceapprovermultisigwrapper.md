# Class: GovernanceApproverMultiSigWrapper

Contract for handling multisig governance approvar actions

## Hierarchy

  ↳ [MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)

  ↳ **GovernanceApproverMultiSigWrapper**

## Index

### Constructors

* [constructor](_wrappers_governanceapprovermultisig_.governanceapprovermultisigwrapper.md#constructor)

### Properties

* [isowner](_wrappers_governanceapprovermultisig_.governanceapprovermultisigwrapper.md#isowner)

### Accessors

* [address](_wrappers_governanceapprovermultisig_.governanceapprovermultisigwrapper.md#address)

### Methods

* [submitOrConfirmTransaction](_wrappers_governanceapprovermultisig_.governanceapprovermultisigwrapper.md#submitorconfirmtransaction)

## Constructors

###  constructor

\+ **new GovernanceApproverMultiSigWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: MultiSig): *[GovernanceApproverMultiSigWrapper](_wrappers_governanceapprovermultisig_.governanceapprovermultisigwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | MultiSig |

**Returns:** *[GovernanceApproverMultiSigWrapper](_wrappers_governanceapprovermultisig_.governanceapprovermultisigwrapper.md)*

## Properties

###  isowner

• **isowner**: *function* = proxyCall(this.contract.methods.isOwner)

*Inherited from [MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md).[isowner](_wrappers_multisig_.multisigwrapper.md#isowner)*

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

*Inherited from [MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md).[submitOrConfirmTransaction](_wrappers_multisig_.multisigwrapper.md#submitorconfirmtransaction)*

*Defined in [contractkit/src/wrappers/MultiSig.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L14)*

Allows an owner to submit and confirm a transaction.

**Parameters:**

Name | Type |
------ | ------ |
`destination` | string |
`txObject` | TransactionObject‹any› |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void› | [CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string››*
