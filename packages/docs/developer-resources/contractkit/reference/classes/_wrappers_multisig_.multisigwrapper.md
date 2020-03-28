# Class: MultiSigWrapper

Contract for handling multisig actions

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹MultiSig›

  ↳ **MultiSigWrapper**

## Index

### Constructors

* [constructor](_wrappers_multisig_.multisigwrapper.md#constructor)

### Properties

* [events](_wrappers_multisig_.multisigwrapper.md#events)
* [getInternalRequired](_wrappers_multisig_.multisigwrapper.md#getinternalrequired)
* [getOwners](_wrappers_multisig_.multisigwrapper.md#getowners)
* [getRequired](_wrappers_multisig_.multisigwrapper.md#getrequired)
* [getTransactionCount](_wrappers_multisig_.multisigwrapper.md#gettransactioncount)
* [isowner](_wrappers_multisig_.multisigwrapper.md#isowner)

### Accessors

* [address](_wrappers_multisig_.multisigwrapper.md#address)

### Methods

* [getTransaction](_wrappers_multisig_.multisigwrapper.md#gettransaction)
* [getTransactions](_wrappers_multisig_.multisigwrapper.md#gettransactions)
* [submitOrConfirmTransaction](_wrappers_multisig_.multisigwrapper.md#submitorconfirmtransaction)

## Constructors

###  constructor

\+ **new MultiSigWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: MultiSig): *[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | MultiSig |

**Returns:** *[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)*

## Properties

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  getInternalRequired

• **getInternalRequired**: *function* = proxyCall(this.contract.methods.internalRequired, undefined, (a: string) =>
    parseInt(a, 10)
  )

*Defined in [contractkit/src/wrappers/MultiSig.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L51)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getOwners

• **getOwners**: *function* = proxyCall(this.contract.methods.getOwners)

*Defined in [contractkit/src/wrappers/MultiSig.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L49)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getRequired

• **getRequired**: *function* = proxyCall(this.contract.methods.required, undefined, (a: string) => parseInt(a, 10))

*Defined in [contractkit/src/wrappers/MultiSig.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L50)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getTransactionCount

• **getTransactionCount**: *function* = proxyCall(this.contract.methods.transactionCount, undefined, (a: string) =>
    parseInt(a, 10)
  )

*Defined in [contractkit/src/wrappers/MultiSig.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L54)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isowner

• **isowner**: *function* = proxyCall(this.contract.methods.isOwner)

*Defined in [contractkit/src/wrappers/MultiSig.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L48)*

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

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  getTransaction

▸ **getTransaction**(`i`: number): *Promise‹[TransactionData](../interfaces/_wrappers_multisig_.transactiondata.md)›*

*Defined in [contractkit/src/wrappers/MultiSig.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`i` | number |

**Returns:** *Promise‹[TransactionData](../interfaces/_wrappers_multisig_.transactiondata.md)›*

___

###  getTransactions

▸ **getTransactions**(): *Promise‹[TransactionData](../interfaces/_wrappers_multisig_.transactiondata.md)[]›*

*Defined in [contractkit/src/wrappers/MultiSig.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L77)*

**Returns:** *Promise‹[TransactionData](../interfaces/_wrappers_multisig_.transactiondata.md)[]›*

___

###  submitOrConfirmTransaction

▸ **submitOrConfirmTransaction**(`destination`: string, `txObject`: TransactionObject‹any›): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void› | [CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string››*

*Defined in [contractkit/src/wrappers/MultiSig.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L25)*

Allows an owner to submit and confirm a transaction.
If an unexecuted transaction matching `txObject` exists on the multisig, adds a confirmation to that tx ID.
Otherwise, submits the `txObject` to the multisig and add confirmation.

**Parameters:**

Name | Type |
------ | ------ |
`destination` | string |
`txObject` | TransactionObject‹any› |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void› | [CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string››*
