# MultiSigWrapper

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
* [replaceOwner](_wrappers_multisig_.multisigwrapper.md#replaceowner)

### Accessors

* [address](_wrappers_multisig_.multisigwrapper.md#address)

### Methods

* [getTransaction](_wrappers_multisig_.multisigwrapper.md#gettransaction)
* [getTransactions](_wrappers_multisig_.multisigwrapper.md#gettransactions)
* [submitOrConfirmTransaction](_wrappers_multisig_.multisigwrapper.md#submitorconfirmtransaction)

## Constructors

### constructor

+ **new MultiSigWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: MultiSig\): [_MultiSigWrapper_](_wrappers_multisig_.multisigwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | MultiSig |

**Returns:** [_MultiSigWrapper_](_wrappers_multisig_.multisigwrapper.md)

## Properties

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### getInternalRequired

• **getInternalRequired**: _function_ = proxyCall\( this.contract.methods.internalRequired, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L62)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getOwners

• **getOwners**: _function_ = proxyCall\(this.contract.methods.getOwners\)

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L60)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getRequired

• **getRequired**: _function_ = proxyCall\(this.contract.methods.required, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L61)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getTransactionCount

• **getTransactionCount**: _function_ = proxyCall\(this.contract.methods.transactionCount, undefined, valueToInt\)

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:67_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L67)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isowner

• **isowner**: _function_ = proxyCall\(this.contract.methods.isOwner\)

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L59)

#### Type declaration:

▸ \(`owner`: [Address](../external-modules/_base_.md#address)\): _Promise‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `owner` | [Address](../external-modules/_base_.md#address) |

### replaceOwner

• **replaceOwner**: _function_ = proxySend\( this.kit, this.contract.methods.replaceOwner, tupleParser\(stringIdentity, stringIdentity\) \)

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L68)

#### Type declaration:

▸ \(`owner`: [Address](../external-modules/_base_.md#address), `newOwner`: [Address](../external-modules/_base_.md#address)\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `owner` | [Address](../external-modules/_base_.md#address) |
| `newOwner` | [Address](../external-modules/_base_.md#address) |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### getTransaction

▸ **getTransaction**\(`i`: number\): _Promise‹_[_TransactionData_](../interfaces/_wrappers_multisig_.transactiondata.md)_›_

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:74_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L74)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `i` | number |

**Returns:** _Promise‹_[_TransactionData_](../interfaces/_wrappers_multisig_.transactiondata.md)_›_

### getTransactions

▸ **getTransactions**\(\): _Promise‹_[_TransactionData_](../interfaces/_wrappers_multisig_.transactiondata.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L93)

**Returns:** _Promise‹_[_TransactionData_](../interfaces/_wrappers_multisig_.transactiondata.md)_\[\]›_

### submitOrConfirmTransaction

▸ **submitOrConfirmTransaction**\(`destination`: string, `txObject`: TransactionObject‹any›\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void› \|_ [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹string››_

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MultiSig.ts#L36)

Allows an owner to submit and confirm a transaction. If an unexecuted transaction matching `txObject` exists on the multisig, adds a confirmation to that tx ID. Otherwise, submits the `txObject` to the multisig and add confirmation.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `destination` | string |
| `txObject` | TransactionObject‹any› |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void› \|_ [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹string››_

