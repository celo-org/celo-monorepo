# Class: MultiSigWrapper

Contract for handling multisig actions

## Hierarchy

* [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)‹MultiSig›

  ↳ **MultiSigWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_multisig_.multisigwrapper.md#constructor)

### Properties

* [events](_contractkit_src_wrappers_multisig_.multisigwrapper.md#events)
* [getInternalRequired](_contractkit_src_wrappers_multisig_.multisigwrapper.md#getinternalrequired)
* [getOwners](_contractkit_src_wrappers_multisig_.multisigwrapper.md#getowners)
* [getRequired](_contractkit_src_wrappers_multisig_.multisigwrapper.md#getrequired)
* [getTransactionCount](_contractkit_src_wrappers_multisig_.multisigwrapper.md#gettransactioncount)
* [isowner](_contractkit_src_wrappers_multisig_.multisigwrapper.md#isowner)

### Accessors

* [address](_contractkit_src_wrappers_multisig_.multisigwrapper.md#address)

### Methods

* [getTransaction](_contractkit_src_wrappers_multisig_.multisigwrapper.md#gettransaction)
* [getTransactions](_contractkit_src_wrappers_multisig_.multisigwrapper.md#gettransactions)
* [submitOrConfirmTransaction](_contractkit_src_wrappers_multisig_.multisigwrapper.md#submitorconfirmtransaction)

## Constructors

###  constructor

\+ **new MultiSigWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: MultiSig): *[MultiSigWrapper](_contractkit_src_wrappers_multisig_.multisigwrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | MultiSig |

**Returns:** *[MultiSigWrapper](_contractkit_src_wrappers_multisig_.multisigwrapper.md)*

## Properties

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[events](_contractkit_src_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  getInternalRequired

• **getInternalRequired**: *function* = proxyCall(
    this.contract.methods.internalRequired,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/MultiSig.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L58)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getOwners

• **getOwners**: *function* = proxyCall(this.contract.methods.getOwners)

*Defined in [contractkit/src/wrappers/MultiSig.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L56)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getRequired

• **getRequired**: *function* = proxyCall(this.contract.methods.required, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/MultiSig.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L57)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getTransactionCount

• **getTransactionCount**: *function* = proxyCall(this.contract.methods.transactionCount, undefined, valueToInt)

*Defined in [contractkit/src/wrappers/MultiSig.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L63)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isowner

• **isowner**: *function* = proxyCall(this.contract.methods.isOwner)

*Defined in [contractkit/src/wrappers/MultiSig.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L55)*

#### Type declaration:

▸ (`owner`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`owner` | [Address](../modules/_contractkit_src_base_.md#address) |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[address](_contractkit_src_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  getTransaction

▸ **getTransaction**(`i`: number): *Promise‹[TransactionData](../interfaces/_contractkit_src_wrappers_multisig_.transactiondata.md)›*

*Defined in [contractkit/src/wrappers/MultiSig.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L65)*

**Parameters:**

Name | Type |
------ | ------ |
`i` | number |

**Returns:** *Promise‹[TransactionData](../interfaces/_contractkit_src_wrappers_multisig_.transactiondata.md)›*

___

###  getTransactions

▸ **getTransactions**(): *Promise‹[TransactionData](../interfaces/_contractkit_src_wrappers_multisig_.transactiondata.md)[]›*

*Defined in [contractkit/src/wrappers/MultiSig.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L84)*

**Returns:** *Promise‹[TransactionData](../interfaces/_contractkit_src_wrappers_multisig_.transactiondata.md)[]›*

___

###  submitOrConfirmTransaction

▸ **submitOrConfirmTransaction**(`destination`: string, `txObject`: TransactionObject‹any›): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void› | [CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹string››*

*Defined in [contractkit/src/wrappers/MultiSig.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L32)*

Allows an owner to submit and confirm a transaction.
If an unexecuted transaction matching `txObject` exists on the multisig, adds a confirmation to that tx ID.
Otherwise, submits the `txObject` to the multisig and add confirmation.

**Parameters:**

Name | Type |
------ | ------ |
`destination` | string |
`txObject` | TransactionObject‹any› |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void› | [CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹string››*
