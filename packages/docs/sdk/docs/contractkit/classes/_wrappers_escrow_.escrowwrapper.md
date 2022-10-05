[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/Escrow"](../modules/_wrappers_escrow_.md) › [EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)

# Class: EscrowWrapper

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
* [version](_wrappers_escrow_.escrowwrapper.md#version)

## Constructors

###  constructor

\+ **new EscrowWrapper**(`connection`: Connection, `contract`: Escrow): *[EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | Escrow |

**Returns:** *[EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)*

## Properties

###  escrowedPayments

• **escrowedPayments**: *function* = proxyCall(this.contract.methods.escrowedPayments)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L8)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L63)*

___

###  events

• **events**: *Escrow["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  getReceivedPaymentIds

• **getReceivedPaymentIds**: *function* = proxyCall(this.contract.methods.getReceivedPaymentIds)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L14)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getSentPaymentIds

• **getSentPaymentIds**: *function* = proxyCall(this.contract.methods.getSentPaymentIds)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L16)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  methodIds

• **methodIds**: *Record‹keyof T["methods"], string›* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined
          ? '0x'
          : this.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L68)*

___

###  receivedPaymentIds

• **receivedPaymentIds**: *function* = proxyCall(this.contract.methods.receivedPaymentIds)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L10)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  revoke

• **revoke**: *function* = proxySend(this.connection, this.contract.methods.revoke)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L22)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  sentPaymentIds

• **sentPaymentIds**: *function* = proxyCall(this.contract.methods.sentPaymentIds)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L12)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  transfer

• **transfer**: *function* = proxySend(this.connection, this.contract.methods.transfer)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L18)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  withdraw

• **withdraw**: *function* = proxySend(this.connection, this.contract.methods.withdraw)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L20)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹Escrow›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹Escrow› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
