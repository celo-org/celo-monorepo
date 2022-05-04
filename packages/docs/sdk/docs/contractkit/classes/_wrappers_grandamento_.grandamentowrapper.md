[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/GrandaMento"](../modules/_wrappers_grandamento_.md) › [GrandaMentoWrapper](_wrappers_grandamento_.grandamentowrapper.md)

# Class: GrandaMentoWrapper

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹GrandaMento›

  ↳ **GrandaMentoWrapper**

## Index

### Constructors

* [constructor](_wrappers_grandamento_.grandamentowrapper.md#constructor)

### Properties

* [approveExchangeProposal](_wrappers_grandamento_.grandamentowrapper.md#approveexchangeproposal)
* [approver](_wrappers_grandamento_.grandamentowrapper.md#approver)
* [cancelExchangeProposal](_wrappers_grandamento_.grandamentowrapper.md#cancelexchangeproposal)
* [eventTypes](_wrappers_grandamento_.grandamentowrapper.md#eventtypes)
* [events](_wrappers_grandamento_.grandamentowrapper.md#events)
* [exchangeProposalCount](_wrappers_grandamento_.grandamentowrapper.md#exchangeproposalcount)
* [executeExchangeProposal](_wrappers_grandamento_.grandamentowrapper.md#executeexchangeproposal)
* [maxApprovalExchangeRateChange](_wrappers_grandamento_.grandamentowrapper.md#maxapprovalexchangeratechange)
* [methodIds](_wrappers_grandamento_.grandamentowrapper.md#methodids)
* [owner](_wrappers_grandamento_.grandamentowrapper.md#owner)
* [setApprover](_wrappers_grandamento_.grandamentowrapper.md#setapprover)
* [setMaxApprovalExchangeRateChange](_wrappers_grandamento_.grandamentowrapper.md#setmaxapprovalexchangeratechange)
* [setSpread](_wrappers_grandamento_.grandamentowrapper.md#setspread)
* [setStableTokenExchangeLimits](_wrappers_grandamento_.grandamentowrapper.md#setstabletokenexchangelimits)
* [setVetoPeriodSeconds](_wrappers_grandamento_.grandamentowrapper.md#setvetoperiodseconds)
* [spread](_wrappers_grandamento_.grandamentowrapper.md#spread)
* [vetoPeriodSeconds](_wrappers_grandamento_.grandamentowrapper.md#vetoperiodseconds)

### Accessors

* [address](_wrappers_grandamento_.grandamentowrapper.md#address)

### Methods

* [createExchangeProposal](_wrappers_grandamento_.grandamentowrapper.md#createexchangeproposal)
* [exchangeProposalExists](_wrappers_grandamento_.grandamentowrapper.md#exchangeproposalexists)
* [getActiveProposalIds](_wrappers_grandamento_.grandamentowrapper.md#getactiveproposalids)
* [getAllStableTokenLimits](_wrappers_grandamento_.grandamentowrapper.md#getallstabletokenlimits)
* [getBuyAmount](_wrappers_grandamento_.grandamentowrapper.md#getbuyamount)
* [getConfig](_wrappers_grandamento_.grandamentowrapper.md#getconfig)
* [getExchangeProposal](_wrappers_grandamento_.grandamentowrapper.md#getexchangeproposal)
* [getHumanReadableExchangeProposal](_wrappers_grandamento_.grandamentowrapper.md#gethumanreadableexchangeproposal)
* [getPastEvents](_wrappers_grandamento_.grandamentowrapper.md#getpastevents)
* [stableTokenExchangeLimits](_wrappers_grandamento_.grandamentowrapper.md#stabletokenexchangelimits)
* [version](_wrappers_grandamento_.grandamentowrapper.md#version)

## Constructors

###  constructor

\+ **new GrandaMentoWrapper**(`connection`: Connection, `contract`: GrandaMento): *[GrandaMentoWrapper](_wrappers_grandamento_.grandamentowrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | GrandaMento |

**Returns:** *[GrandaMentoWrapper](_wrappers_grandamento_.grandamentowrapper.md)*

## Properties

###  approveExchangeProposal

• **approveExchangeProposal**: *function* = proxySend(
    this.connection,
    this.contract.methods.approveExchangeProposal
  )

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L105)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  approver

• **approver**: *function* = proxyCall(this.contract.methods.approver)

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L65)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  cancelExchangeProposal

• **cancelExchangeProposal**: *function* = proxySend(this.connection, this.contract.methods.cancelExchangeProposal)

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L114)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

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

• **events**: *GrandaMento["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  exchangeProposalCount

• **exchangeProposalCount**: *function* = proxyCall(
    this.contract.methods.exchangeProposalCount,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L88)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  executeExchangeProposal

• **executeExchangeProposal**: *function* = proxySend(
    this.connection,
    this.contract.methods.executeExchangeProposal
  )

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L110)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  maxApprovalExchangeRateChange

• **maxApprovalExchangeRateChange**: *function* = proxyCall(
    this.contract.methods.maxApprovalExchangeRateChange,
    undefined,
    fixidityValueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L68)*

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

###  owner

• **owner**: *function* = proxyCall(this.contract.methods.owner)

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L63)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setApprover

• **setApprover**: *function* = proxySend(this.connection, this.contract.methods.setApprover)

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L66)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setMaxApprovalExchangeRateChange

• **setMaxApprovalExchangeRateChange**: *function* = proxySend(
    this.connection,
    this.contract.methods.setMaxApprovalExchangeRateChange
  )

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L73)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setSpread

• **setSpread**: *function* = proxySend(this.connection, this.contract.methods.setSpread)

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L79)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setStableTokenExchangeLimits

• **setStableTokenExchangeLimits**: *function* = proxySend(
    this.connection,
    this.contract.methods.setStableTokenExchangeLimits
  )

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L100)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setVetoPeriodSeconds

• **setVetoPeriodSeconds**: *function* = proxySend(this.connection, this.contract.methods.setVetoPeriodSeconds)

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L86)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  spread

• **spread**: *function* = proxyCall(this.contract.methods.spread, undefined, fixidityValueToBigNumber)

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L78)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  vetoPeriodSeconds

• **vetoPeriodSeconds**: *function* = proxyCall(
    this.contract.methods.vetoPeriodSeconds,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L81)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

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

###  createExchangeProposal

▸ **createExchangeProposal**(`stableTokenRegistryId`: [StableTokenContract](../modules/_base_.md#stabletokencontract), `sellAmount`: BigNumber, `sellCelo`: boolean): *Promise‹CeloTransactionObject‹string››*

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:116](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L116)*

**Parameters:**

Name | Type |
------ | ------ |
`stableTokenRegistryId` | [StableTokenContract](../modules/_base_.md#stabletokencontract) |
`sellAmount` | BigNumber |
`sellCelo` | boolean |

**Returns:** *Promise‹CeloTransactionObject‹string››*

___

###  exchangeProposalExists

▸ **exchangeProposalExists**(`exchangeProposalID`: string | number): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L128)*

**Parameters:**

Name | Type |
------ | ------ |
`exchangeProposalID` | string &#124; number |

**Returns:** *Promise‹boolean›*

___

###  getActiveProposalIds

▸ **getActiveProposalIds**(): *Promise‹string[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L94)*

**Returns:** *Promise‹string[]›*

___

###  getAllStableTokenLimits

▸ **getAllStableTokenLimits**(): *Promise‹AllStableConfig›*

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:190](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L190)*

**Returns:** *Promise‹AllStableConfig›*

___

###  getBuyAmount

▸ **getBuyAmount**(`celoStableTokenOracleRate`: BigNumber, `sellAmount`: BigNumber, `sellCelo`: boolean): *Promise‹BigNumber›*

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:204](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L204)*

**Parameters:**

Name | Type |
------ | ------ |
`celoStableTokenOracleRate` | BigNumber |
`sellAmount` | BigNumber |
`sellCelo` | boolean |

**Returns:** *Promise‹BigNumber›*

___

###  getConfig

▸ **getConfig**(): *Promise‹[GrandaMentoConfig](../interfaces/_wrappers_grandamento_.grandamentoconfig.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:215](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L215)*

**Returns:** *Promise‹[GrandaMentoConfig](../interfaces/_wrappers_grandamento_.grandamentoconfig.md)›*

___

###  getExchangeProposal

▸ **getExchangeProposal**(`exchangeProposalID`: string | number): *Promise‹[ExchangeProposal](../interfaces/_wrappers_grandamento_.exchangeproposal.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L134)*

**Parameters:**

Name | Type |
------ | ------ |
`exchangeProposalID` | string &#124; number |

**Returns:** *Promise‹[ExchangeProposal](../interfaces/_wrappers_grandamento_.exchangeproposal.md)›*

___

###  getHumanReadableExchangeProposal

▸ **getHumanReadableExchangeProposal**(`exchangeProposalID`: string | number): *Promise‹[ExchangeProposalReadable](../interfaces/_wrappers_grandamento_.exchangeproposalreadable.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:155](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L155)*

**Parameters:**

Name | Type |
------ | ------ |
`exchangeProposalID` | string &#124; number |

**Returns:** *Promise‹[ExchangeProposalReadable](../interfaces/_wrappers_grandamento_.exchangeproposalreadable.md)›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹GrandaMento›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹GrandaMento› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  stableTokenExchangeLimits

▸ **stableTokenExchangeLimits**(`stableTokenSymbol`: StableTokenEnum): *Promise‹[StableTokenExchangeLimits](../interfaces/_wrappers_grandamento_.stabletokenexchangelimits.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/GrandaMento.ts:177](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GrandaMento.ts#L177)*

**Parameters:**

Name | Type |
------ | ------ |
`stableTokenSymbol` | StableTokenEnum |

**Returns:** *Promise‹[StableTokenExchangeLimits](../interfaces/_wrappers_grandamento_.stabletokenexchangelimits.md)›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
