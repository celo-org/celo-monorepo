# MultiSigWrapper

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

### constructor

+ **new MultiSigWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: MultiSig\): [_MultiSigWrapper_](_wrappers_multisig_.multisigwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | MultiSig |

**Returns:** [_MultiSigWrapper_](_wrappers_multisig_.multisigwrapper.md)

## Properties

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_eventTypes_](_wrappers_basewrapper_.basewrapper.md#eventtypes)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _MultiSig\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### getInternalRequired

• **getInternalRequired**: _function_ = proxyCall\( this.contract.methods.internalRequired, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:64_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MultiSig.ts#L64)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getOwners

• **getOwners**: _function_ = proxyCall\(this.contract.methods.getOwners\)

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MultiSig.ts#L62)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getRequired

• **getRequired**: _function_ = proxyCall\(this.contract.methods.required, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:63_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MultiSig.ts#L63)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getTransactionCount

• **getTransactionCount**: _function_ = proxyCall\(this.contract.methods.transactionCount, undefined, valueToInt\)

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MultiSig.ts#L69)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isowner

• **isowner**: _function_ = proxyCall\(this.contract.methods.isOwner\)

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MultiSig.ts#L61)

#### Type declaration:

▸ \(`owner`: Address\): _Promise‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `owner` | Address |

### methodIds

• **methodIds**: _Record‹keyof T\["methods"\], string›_ = Object.keys\(this.contract.methods\).reduce, string&gt;&gt;\( \(acc, method: Methods\) =&gt; { const methodABI = this.contract.options.jsonInterface.find\(\(item\) =&gt; item.name === method\)

```text
  acc[method] =
    methodABI === undefined
      ? '0x'
      : this.kit.connection.getAbiCoder().encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_methodIds_](_wrappers_basewrapper_.basewrapper.md#methodids)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)

### replaceOwner

• **replaceOwner**: _function_ = proxySend\( this.kit, this.contract.methods.replaceOwner, tupleParser\(stringIdentity, stringIdentity\) \)

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MultiSig.ts#L70)

#### Type declaration:

▸ \(`owner`: Address, `newOwner`: Address\): _CeloTransactionObject‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `owner` | Address |
| `newOwner` | Address |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹MultiSig›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_getPastEvents_](_wrappers_basewrapper_.basewrapper.md#getpastevents)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹MultiSig› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getTransaction

▸ **getTransaction**\(`i`: number\): _Promise‹_[_TransactionData_](../interfaces/_wrappers_multisig_.transactiondata.md)_›_

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:76_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MultiSig.ts#L76)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `i` | number |

**Returns:** _Promise‹_[_TransactionData_](../interfaces/_wrappers_multisig_.transactiondata.md)_›_

### getTransactions

▸ **getTransactions**\(\): _Promise‹_[_TransactionData_](../interfaces/_wrappers_multisig_.transactiondata.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:95_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MultiSig.ts#L95)

**Returns:** _Promise‹_[_TransactionData_](../interfaces/_wrappers_multisig_.transactiondata.md)_\[\]›_

### submitOrConfirmTransaction

▸ **submitOrConfirmTransaction**\(`destination`: string, `txObject`: CeloTxObject‹any›, `value`: string\): _Promise‹CeloTransactionObject‹void› \| CeloTransactionObject‹string››_

_Defined in_ [_contractkit/src/wrappers/MultiSig.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MultiSig.ts#L33)

Allows an owner to submit and confirm a transaction. If an unexecuted transaction matching `txObject` exists on the multisig, adds a confirmation to that tx ID. Otherwise, submits the `txObject` to the multisig and add confirmation.

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `destination` | string | - |
| `txObject` | CeloTxObject‹any› | - |
| `value` | string | "0" |

**Returns:** _Promise‹CeloTransactionObject‹void› \| CeloTransactionObject‹string››_

