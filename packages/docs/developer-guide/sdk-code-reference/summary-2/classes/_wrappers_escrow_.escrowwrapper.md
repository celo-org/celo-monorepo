# EscrowWrapper

Contract for handling reserve for stable currencies

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Escrow›

  ↳ **EscrowWrapper**

## Index

### Constructors

* [constructor](_wrappers_escrow_.escrowwrapper.md#constructor)

### Properties

* [escrowedPayments](_wrappers_escrow_.escrowwrapper.md#escrowedpayments)
* [eventTypes](_wrappers_escrow_.escrowwrapper.md#eventtypes)
* [events](_wrappers_escrow_.escrowwrapper.md#events)
* [getReceivedPaymentIds](_wrappers_escrow_.escrowwrapper.md#getreceivedpaymentids)
* [getSentPaymentIds](_wrappers_escrow_.escrowwrapper.md#getsentpaymentids)
* [methodIds](_wrappers_escrow_.escrowwrapper.md#methodids)
* [receivedPaymentIds](_wrappers_escrow_.escrowwrapper.md#receivedpaymentids)
* [revoke](_wrappers_escrow_.escrowwrapper.md#revoke)
* [sentPaymentIds](_wrappers_escrow_.escrowwrapper.md#sentpaymentids)
* [transfer](_wrappers_escrow_.escrowwrapper.md#transfer)
* [withdraw](_wrappers_escrow_.escrowwrapper.md#withdraw)

### Accessors

* [address](_wrappers_escrow_.escrowwrapper.md#address)

### Methods

* [getPastEvents](_wrappers_escrow_.escrowwrapper.md#getpastevents)

## Constructors

### constructor

+ **new EscrowWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Escrow\): [_EscrowWrapper_](_wrappers_escrow_.escrowwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | Escrow |

**Returns:** [_EscrowWrapper_](_wrappers_escrow_.escrowwrapper.md)

## Properties

### escrowedPayments

• **escrowedPayments**: _function_ = proxyCall\(this.contract.methods.escrowedPayments\)

_Defined in_ [_contractkit/src/wrappers/Escrow.ts:8_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L8)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_eventTypes_](_wrappers_basewrapper_.basewrapper.md#eventtypes)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _Escrow\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### getReceivedPaymentIds

• **getReceivedPaymentIds**: _function_ = proxyCall\(this.contract.methods.getReceivedPaymentIds\)

_Defined in_ [_contractkit/src/wrappers/Escrow.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L14)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getSentPaymentIds

• **getSentPaymentIds**: _function_ = proxyCall\(this.contract.methods.getSentPaymentIds\)

_Defined in_ [_contractkit/src/wrappers/Escrow.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L16)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

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

### receivedPaymentIds

• **receivedPaymentIds**: _function_ = proxyCall\(this.contract.methods.receivedPaymentIds\)

_Defined in_ [_contractkit/src/wrappers/Escrow.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L10)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### revoke

• **revoke**: _function_ = proxySend\(this.kit, this.contract.methods.revoke\)

_Defined in_ [_contractkit/src/wrappers/Escrow.ts:22_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L22)

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### sentPaymentIds

• **sentPaymentIds**: _function_ = proxyCall\(this.contract.methods.sentPaymentIds\)

_Defined in_ [_contractkit/src/wrappers/Escrow.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L12)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### transfer

• **transfer**: _function_ = proxySend\(this.kit, this.contract.methods.transfer\)

_Defined in_ [_contractkit/src/wrappers/Escrow.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L18)

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### withdraw

• **withdraw**: _function_ = proxySend\(this.kit, this.contract.methods.withdraw\)

_Defined in_ [_contractkit/src/wrappers/Escrow.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L20)

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Escrow›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_getPastEvents_](_wrappers_basewrapper_.basewrapper.md#getpastevents)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Escrow› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

