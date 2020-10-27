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
* [replaceOwner](_contractkit_src_wrappers_multisig_.multisigwrapper.md#replaceowner)

### Accessors

* [address](_contractkit_src_wrappers_multisig_.multisigwrapper.md#address)

### Methods

* [getPastEvents](_contractkit_src_wrappers_multisig_.multisigwrapper.md#getpastevents)
* [getTransaction](_contractkit_src_wrappers_multisig_.multisigwrapper.md#gettransaction)
* [getTransactions](_contractkit_src_wrappers_multisig_.multisigwrapper.md#gettransactions)
* [submitOrConfirmTransaction](_contractkit_src_wrappers_multisig_.multisigwrapper.md#submitorconfirmtransaction)

## Constructors

###  constructor

\+ **new MultiSigWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: MultiSig): *[MultiSigWrapper](_contractkit_src_wrappers_multisig_.multisigwrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  getInternalRequired

• **getInternalRequired**: *function* = proxyCall(
    this.contract.methods.internalRequired,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/MultiSig.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L67)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getOwners

• **getOwners**: *function* = proxyCall(this.contract.methods.getOwners)

*Defined in [packages/contractkit/src/wrappers/MultiSig.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L65)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getRequired

• **getRequired**: *function* = proxyCall(this.contract.methods.required, undefined, valueToBigNumber)

*Defined in [packages/contractkit/src/wrappers/MultiSig.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L66)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getTransactionCount

• **getTransactionCount**: *function* = proxyCall(this.contract.methods.transactionCount, undefined, valueToInt)

*Defined in [packages/contractkit/src/wrappers/MultiSig.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L72)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isowner

• **isowner**: *function* = proxyCall(this.contract.methods.isOwner)

*Defined in [packages/contractkit/src/wrappers/MultiSig.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L64)*

#### Type declaration:

▸ (`owner`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`owner` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  replaceOwner

• **replaceOwner**: *function* = proxySend(
    this.kit,
    this.contract.methods.replaceOwner,
    tupleParser(stringIdentity, stringIdentity)
  )

*Defined in [packages/contractkit/src/wrappers/MultiSig.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L73)*

#### Type declaration:

▸ (`owner`: [Address](../modules/_contractkit_src_base_.md#address), `newOwner`: [Address](../modules/_contractkit_src_base_.md#address)): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`owner` | [Address](../modules/_contractkit_src_base_.md#address) |
`newOwner` | [Address](../modules/_contractkit_src_base_.md#address) |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[address](_contractkit_src_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  getPastEvents

▸ **getPastEvents**(`event`: string, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_contractkit_src_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L29)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | string |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getTransaction

▸ **getTransaction**(`i`: number): *Promise‹[TransactionData](../interfaces/_contractkit_src_wrappers_multisig_.transactiondata.md)›*

*Defined in [packages/contractkit/src/wrappers/MultiSig.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L79)*

**Parameters:**

Name | Type |
------ | ------ |
`i` | number |

**Returns:** *Promise‹[TransactionData](../interfaces/_contractkit_src_wrappers_multisig_.transactiondata.md)›*

___

###  getTransactions

▸ **getTransactions**(): *Promise‹[TransactionData](../interfaces/_contractkit_src_wrappers_multisig_.transactiondata.md)[]›*

*Defined in [packages/contractkit/src/wrappers/MultiSig.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L98)*

**Returns:** *Promise‹[TransactionData](../interfaces/_contractkit_src_wrappers_multisig_.transactiondata.md)[]›*

___

###  submitOrConfirmTransaction

▸ **submitOrConfirmTransaction**(`destination`: string, `txObject`: TransactionObject‹any›, `value`: string): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void› | [CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹string››*

*Defined in [packages/contractkit/src/wrappers/MultiSig.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L36)*

Allows an owner to submit and confirm a transaction.
If an unexecuted transaction matching `txObject` exists on the multisig, adds a confirmation to that tx ID.
Otherwise, submits the `txObject` to the multisig and add confirmation.

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`destination` | string | - |
`txObject` | TransactionObject‹any› | - |
`value` | string | "0" |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void› | [CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹string››*
