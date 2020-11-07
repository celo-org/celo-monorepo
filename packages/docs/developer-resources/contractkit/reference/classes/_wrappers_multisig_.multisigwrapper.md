# Class: MultiSigWrapper

Contract for handling multisig actions

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹MultiSig›

  ↳ **MultiSigWrapper**

## Index

### Constructors

* [constructor](_wrappers_multisig_.multisigwrapper.md#constructor)

### Properties

* [eventTypes](_wrappers_multisig_.multisigwrapper.md#eventtypes)
* [events](_wrappers_multisig_.multisigwrapper.md#events)
* [getInternalRequired](_wrappers_multisig_.multisigwrapper.md#getinternalrequired)
* [getOwners](_wrappers_multisig_.multisigwrapper.md#getowners)
* [getRequired](_wrappers_multisig_.multisigwrapper.md#getrequired)
* [getTransactionCount](_wrappers_multisig_.multisigwrapper.md#gettransactioncount)
* [isowner](_wrappers_multisig_.multisigwrapper.md#isowner)
* [methodIds](_wrappers_multisig_.multisigwrapper.md#methodids)
* [replaceOwner](_wrappers_multisig_.multisigwrapper.md#replaceowner)

### Accessors

* [address](_wrappers_multisig_.multisigwrapper.md#address)

### Methods

* [getPastEvents](_wrappers_multisig_.multisigwrapper.md#getpastevents)
* [getTransaction](_wrappers_multisig_.multisigwrapper.md#gettransaction)
* [getTransactions](_wrappers_multisig_.multisigwrapper.md#gettransactions)
* [submitOrConfirmTransaction](_wrappers_multisig_.multisigwrapper.md#submitorconfirmtransaction)

## Constructors

###  constructor

\+ **new MultiSigWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: MultiSig): *[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | MultiSig |

**Returns:** *[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)*

## Properties

###  eventTypes

• **eventTypes**: *object* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)*

#### Type declaration:

___

###  events

• **events**: *MultiSig["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)*

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

▸ (`owner`: [Address](../modules/_base_.md#address)): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`owner` | [Address](../modules/_base_.md#address) |

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)*

#### Type declaration:

___

###  replaceOwner

• **replaceOwner**: *function* = proxySend(
    this.kit,
    this.contract.methods.replaceOwner,
    tupleParser(stringIdentity, stringIdentity)
  )

*Defined in [packages/contractkit/src/wrappers/MultiSig.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L73)*

#### Type declaration:

▸ (`owner`: [Address](../modules/_base_.md#address), `newOwner`: [Address](../modules/_base_.md#address)): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`owner` | [Address](../modules/_base_.md#address) |
`newOwner` | [Address](../modules/_base_.md#address) |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)*

Contract address

**Returns:** *string*

## Methods

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹MultiSig›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹MultiSig› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getTransaction

▸ **getTransaction**(`i`: number): *Promise‹[TransactionData](../interfaces/_wrappers_multisig_.transactiondata.md)›*

*Defined in [packages/contractkit/src/wrappers/MultiSig.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L79)*

**Parameters:**

Name | Type |
------ | ------ |
`i` | number |

**Returns:** *Promise‹[TransactionData](../interfaces/_wrappers_multisig_.transactiondata.md)›*

___

###  getTransactions

▸ **getTransactions**(): *Promise‹[TransactionData](../interfaces/_wrappers_multisig_.transactiondata.md)[]›*

*Defined in [packages/contractkit/src/wrappers/MultiSig.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L98)*

**Returns:** *Promise‹[TransactionData](../interfaces/_wrappers_multisig_.transactiondata.md)[]›*

___

###  submitOrConfirmTransaction

▸ **submitOrConfirmTransaction**(`destination`: string, `txObject`: TransactionObject‹any›, `value`: string): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void› | [CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string››*

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

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void› | [CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string››*
