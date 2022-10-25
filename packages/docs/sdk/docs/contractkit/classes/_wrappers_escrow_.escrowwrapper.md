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
* [getDefaultTrustedIssuers](_wrappers_escrow_.escrowwrapper.md#getdefaulttrustedissuers)
* [getReceivedPaymentIds](_wrappers_escrow_.escrowwrapper.md#getreceivedpaymentids)
* [getSentPaymentIds](_wrappers_escrow_.escrowwrapper.md#getsentpaymentids)
* [getTrustedIssuersPerPayment](_wrappers_escrow_.escrowwrapper.md#gettrustedissuersperpayment)
* [methodIds](_wrappers_escrow_.escrowwrapper.md#methodids)
* [revoke](_wrappers_escrow_.escrowwrapper.md#revoke)
* [transfer](_wrappers_escrow_.escrowwrapper.md#transfer)
* [transferWithTrustedIssuers](_wrappers_escrow_.escrowwrapper.md#transferwithtrustedissuers)
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

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L15)*

**`notice`** Gets the unique escrowed payment for a given payment ID

**`param`** The ID of the payment to get.

**`returns`** An EscrowedPayment struct which holds information such
as; recipient identifier, sender address, token address, value, etc.

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

###  getDefaultTrustedIssuers

• **getDefaultTrustedIssuers**: *function* = proxyCall(this.contract.methods.getDefaultTrustedIssuers)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L37)*

**`notice`** Gets trusted issuers set as default for payments by `transfer` function.

**`returns`** An array of addresses of trusted issuers.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getReceivedPaymentIds

• **getReceivedPaymentIds**: *function* = proxyCall(this.contract.methods.getReceivedPaymentIds)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L23)*

**`notice`** Gets array of all Escrowed Payments received by identifier.

**`param`** The hash of an identifier of the receiver of the escrowed payment.

**`returns`** An array containing all the IDs of the Escrowed Payments that were received
by the specified receiver.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getSentPaymentIds

• **getSentPaymentIds**: *function* = proxyCall(this.contract.methods.getSentPaymentIds)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L31)*

**`notice`** Gets array of all Escrowed Payment IDs sent by sender.

**`param`** The address of the sender of the escrowed payments.

**`returns`** An array containing all the IDs of the Escrowed Payments that were sent by the
specified sender.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getTrustedIssuersPerPayment

• **getTrustedIssuersPerPayment**: *function* = proxyCall(this.contract.methods.getTrustedIssuersPerPayment)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L44)*

**`notice`** Gets array of all trusted issuers set per paymentId.

**`param`** The ID of the payment to get.

**`returns`** An array of addresses of trusted issuers set for an escrowed payment.

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

###  revoke

• **revoke**: *function* = proxySend(
    this.connection,
    this.contract.methods.revoke
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L97)*

**`notice`** Revokes tokens for a sender who is redeeming a payment after it has expired.

**`param`** The ID for the EscrowedPayment struct that contains all relevant information.

**`dev`** Throws if 'token' or 'value' is 0.

**`dev`** Throws if msg.sender is not the sender of payment.

**`dev`** Throws if redeem time hasn't been reached yet.

#### Type declaration:

▸ (`paymentId`: string): *CeloTransactionObject‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`paymentId` | string |

___

###  transfer

• **transfer**: *function* = proxySend(this.connection, this.contract.methods.transfer)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L64)*

**`notice`** Transfer tokens to a specific user. Supports both identity with privacy (an empty
        identifier and 0 minAttestations) and without (with identifier and minAttestations).
        Sets trustedIssuers to the issuers listed in `defaultTrustedIssuers`.
        (To override this and set custom trusted issuers, use `transferWithTrustedIssuers`.)

**`param`** The hashed identifier of a user to transfer to.

**`param`** The token to be transferred.

**`param`** The amount to be transferred.

**`param`** The number of seconds before the sender can revoke the payment.

**`param`** The address of the temporary wallet associated with this payment. Users must
       prove ownership of the corresponding private key to withdraw from escrow.

**`param`** The min number of attestations required to withdraw the payment.

**`returns`** True if transfer succeeded.

**`dev`** Throws if 'token' or 'value' is 0.

**`dev`** Throws if identifier is null and minAttestations > 0.

**`dev`** If minAttestations is 0, trustedIssuers will be set to empty list.

**`dev`** msg.sender needs to have already approved this contract to transfer

#### Type declaration:

▸ (`identifier`: string, `token`: Address, `value`: number | string, `expirySeconds`: number, `paymentId`: Address, `minAttestations`: number): *CeloTransactionObject‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`token` | Address |
`value` | number &#124; string |
`expirySeconds` | number |
`paymentId` | Address |
`minAttestations` | number |

___

###  transferWithTrustedIssuers

• **transferWithTrustedIssuers**: *function* = proxySend(
    this.connection,
    this.contract.methods.transferWithTrustedIssuers
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L121)*

**`notice`** Transfer tokens to a specific user. Supports both identity with privacy (an empty
        identifier and 0 minAttestations) and without (with identifier
        and attestations completed by trustedIssuers).

**`param`** The hashed identifier of a user to transfer to.

**`param`** The token to be transferred.

**`param`** The amount to be transferred.

**`param`** The number of seconds before the sender can revoke the payment.

**`param`** The address of the temporary wallet associated with this payment. Users must
       prove ownership of the corresponding private key to withdraw from escrow.

**`param`** The min number of attestations required to withdraw the payment.

**`param`** Array of issuers whose attestations in FederatedAttestations.sol
       will be accepted to prove ownership over an identifier.

**`returns`** True if transfer succeeded.

**`dev`** Throws if 'token' or 'value' is 0.

**`dev`** Throws if identifier is null and minAttestations > 0.

**`dev`** Throws if minAttestations == 0 but trustedIssuers are provided.

**`dev`** msg.sender needs to have already approved this contract to transfer.

#### Type declaration:

▸ (`identifier`: string, `token`: Address, `value`: number | string, `expirySeconds`: number, `paymentId`: Address, `minAttestations`: number, `trustedIssuers`: Address[]): *CeloTransactionObject‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`token` | Address |
`value` | number &#124; string |
`expirySeconds` | number |
`paymentId` | Address |
`minAttestations` | number |
`trustedIssuers` | Address[] |

___

###  withdraw

• **withdraw**: *function* = proxySend(this.connection, this.contract.methods.withdraw)

*Defined in [packages/sdk/contractkit/src/wrappers/Escrow.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Escrow.ts#L83)*

**`notice`** Withdraws tokens for a verified user.

**`param`** The ID for the EscrowedPayment struct that contains all relevant information.

**`param`** The recovery id of the incoming ECDSA signature.

**`param`** Output value r of the ECDSA signature.

**`param`** Output value s of the ECDSA signature.

**`returns`** True if withdraw succeeded.

**`dev`** Throws if 'token' or 'value' is 0.

**`dev`** Throws if msg.sender does not prove ownership of the withdraw key.

#### Type declaration:

▸ (`paymentId`: Address, `v`: number | string, `r`: string | number[], `s`: string | number[]): *CeloTransactionObject‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`paymentId` | Address |
`v` | number &#124; string |
`r` | string &#124; number[] |
`s` | string &#124; number[] |

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
