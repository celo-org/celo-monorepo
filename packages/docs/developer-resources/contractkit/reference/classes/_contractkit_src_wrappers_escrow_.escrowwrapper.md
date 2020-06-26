# Class: EscrowWrapper

Contract for handling reserve for stable currencies

## Hierarchy

* [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)‹Escrow›

  ↳ **EscrowWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_escrow_.escrowwrapper.md#constructor)

### Properties

* [escrowedPayments](_contractkit_src_wrappers_escrow_.escrowwrapper.md#escrowedpayments)
* [events](_contractkit_src_wrappers_escrow_.escrowwrapper.md#events)
* [getReceivedPaymentIds](_contractkit_src_wrappers_escrow_.escrowwrapper.md#getreceivedpaymentids)
* [getSentPaymentIds](_contractkit_src_wrappers_escrow_.escrowwrapper.md#getsentpaymentids)
* [receivedPaymentIds](_contractkit_src_wrappers_escrow_.escrowwrapper.md#receivedpaymentids)
* [revoke](_contractkit_src_wrappers_escrow_.escrowwrapper.md#revoke)
* [sentPaymentIds](_contractkit_src_wrappers_escrow_.escrowwrapper.md#sentpaymentids)
* [transfer](_contractkit_src_wrappers_escrow_.escrowwrapper.md#transfer)
* [withdraw](_contractkit_src_wrappers_escrow_.escrowwrapper.md#withdraw)

### Accessors

* [address](_contractkit_src_wrappers_escrow_.escrowwrapper.md#address)

### Methods

* [getPastEvents](_contractkit_src_wrappers_escrow_.escrowwrapper.md#getpastevents)

## Constructors

###  constructor

\+ **new EscrowWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: Escrow): *[EscrowWrapper](_contractkit_src_wrappers_escrow_.escrowwrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | Escrow |

**Returns:** *[EscrowWrapper](_contractkit_src_wrappers_escrow_.escrowwrapper.md)*

## Properties

###  escrowedPayments

• **escrowedPayments**: *function* = proxyCall(this.contract.methods.escrowedPayments)

*Defined in [contractkit/src/wrappers/Escrow.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L8)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[events](_contractkit_src_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  getReceivedPaymentIds

• **getReceivedPaymentIds**: *function* = proxyCall(this.contract.methods.getReceivedPaymentIds)

*Defined in [contractkit/src/wrappers/Escrow.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L14)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getSentPaymentIds

• **getSentPaymentIds**: *function* = proxyCall(this.contract.methods.getSentPaymentIds)

*Defined in [contractkit/src/wrappers/Escrow.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L16)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  receivedPaymentIds

• **receivedPaymentIds**: *function* = proxyCall(this.contract.methods.receivedPaymentIds)

*Defined in [contractkit/src/wrappers/Escrow.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L10)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  revoke

• **revoke**: *function* = proxySend(this.kit, this.contract.methods.revoke)

*Defined in [contractkit/src/wrappers/Escrow.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L22)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  sentPaymentIds

• **sentPaymentIds**: *function* = proxyCall(this.contract.methods.sentPaymentIds)

*Defined in [contractkit/src/wrappers/Escrow.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L12)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  transfer

• **transfer**: *function* = proxySend(this.kit, this.contract.methods.transfer)

*Defined in [contractkit/src/wrappers/Escrow.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L18)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  withdraw

• **withdraw**: *function* = proxySend(this.kit, this.contract.methods.withdraw)

*Defined in [contractkit/src/wrappers/Escrow.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Escrow.ts#L20)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[address](_contractkit_src_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  getPastEvents

▸ **getPastEvents**(`event`: string, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_contractkit_src_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L29)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | string |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*
