[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/OdisPayments"](../modules/_wrappers_odispayments_.md) › [OdisPaymentsWrapper](_wrappers_odispayments_.odispaymentswrapper.md)

# Class: OdisPaymentsWrapper

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹OdisPayments›

  ↳ **OdisPaymentsWrapper**

## Index

### Constructors

* [constructor](_wrappers_odispayments_.odispaymentswrapper.md#constructor)

### Properties

* [eventTypes](_wrappers_odispayments_.odispaymentswrapper.md#eventtypes)
* [events](_wrappers_odispayments_.odispaymentswrapper.md#events)
* [methodIds](_wrappers_odispayments_.odispaymentswrapper.md#methodids)
* [payInCUSD](_wrappers_odispayments_.odispaymentswrapper.md#payincusd)
* [totalPaidCUSD](_wrappers_odispayments_.odispaymentswrapper.md#totalpaidcusd)

### Accessors

* [address](_wrappers_odispayments_.odispaymentswrapper.md#address)

### Methods

* [getPastEvents](_wrappers_odispayments_.odispaymentswrapper.md#getpastevents)
* [version](_wrappers_odispayments_.odispaymentswrapper.md#version)

## Constructors

###  constructor

\+ **new OdisPaymentsWrapper**(`connection`: Connection, `contract`: OdisPayments): *[OdisPaymentsWrapper](_wrappers_odispayments_.odispaymentswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | OdisPayments |

**Returns:** *[OdisPaymentsWrapper](_wrappers_odispayments_.odispaymentswrapper.md)*

## Properties

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L63)*

___

###  events

• **events**: *OdisPayments["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

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

###  payInCUSD

• **payInCUSD**: *function* = proxySend(
    this.connection,
    this.contract.methods.payInCUSD
  )

*Defined in [packages/sdk/contractkit/src/wrappers/OdisPayments.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/OdisPayments.ts#L20)*

**`notice`** Sends cUSD to this contract to pay for ODIS quota (for queries).

**`param`** The account whose balance to increment.

**`param`** The amount in cUSD to pay.

**`dev`** Throws if cUSD transfer fails.

#### Type declaration:

▸ (`account`: Address, `value`: number | string): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |
`value` | number &#124; string |

___

###  totalPaidCUSD

• **totalPaidCUSD**: *function* = proxyCall(
    this.contract.methods.totalPaidCUSD
  )

*Defined in [packages/sdk/contractkit/src/wrappers/OdisPayments.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/OdisPayments.ts#L10)*

**`notice`** Fetches total amount sent (all-time) for given account to odisPayments

**`param`** The account to fetch total amount of funds sent

#### Type declaration:

▸ (`account`: Address): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹OdisPayments›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹OdisPayments› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
