# EscrowWrapper

Contract for handling reserve for stable currencies

## Hierarchy

* [BaseWrapper]()‹Escrow›

  ↳ **EscrowWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [escrowedPayments]()
* [eventTypes]()
* [events]()
* [getReceivedPaymentIds]()
* [getSentPaymentIds]()
* [methodIds]()
* [receivedPaymentIds]()
* [revoke]()
* [sentPaymentIds]()
* [transfer]()
* [withdraw]()

### Accessors

* [address]()

### Methods

* [getPastEvents]()

## Constructors

### constructor

+ **new EscrowWrapper**\(`kit`: [ContractKit](), `contract`: Escrow\): [_EscrowWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Escrow |

**Returns:** [_EscrowWrapper_]()

## Properties

### escrowedPayments

• **escrowedPayments**: _function_ = proxyCall\(this.contract.methods.escrowedPayments\)

_Defined in_ [_packages/contractkit/src/wrappers/Escrow.ts:8_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L8)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)

### events

• **events**: _Escrow\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)

### getReceivedPaymentIds

• **getReceivedPaymentIds**: _function_ = proxyCall\(this.contract.methods.getReceivedPaymentIds\)

_Defined in_ [_packages/contractkit/src/wrappers/Escrow.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L14)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getSentPaymentIds

• **getSentPaymentIds**: _function_ = proxyCall\(this.contract.methods.getSentPaymentIds\)

_Defined in_ [_packages/contractkit/src/wrappers/Escrow.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L16)

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
    methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_]()_._[_methodIds_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)

### receivedPaymentIds

• **receivedPaymentIds**: _function_ = proxyCall\(this.contract.methods.receivedPaymentIds\)

_Defined in_ [_packages/contractkit/src/wrappers/Escrow.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L10)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### revoke

• **revoke**: _function_ = proxySend\(this.kit, this.contract.methods.revoke\)

_Defined in_ [_packages/contractkit/src/wrappers/Escrow.ts:22_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L22)

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### sentPaymentIds

• **sentPaymentIds**: _function_ = proxyCall\(this.contract.methods.sentPaymentIds\)

_Defined in_ [_packages/contractkit/src/wrappers/Escrow.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L12)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### transfer

• **transfer**: _function_ = proxySend\(this.kit, this.contract.methods.transfer\)

_Defined in_ [_packages/contractkit/src/wrappers/Escrow.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L18)

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### withdraw

• **withdraw**: _function_ = proxySend\(this.kit, this.contract.methods.withdraw\)

_Defined in_ [_packages/contractkit/src/wrappers/Escrow.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L20)

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Escrow›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Escrow› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

