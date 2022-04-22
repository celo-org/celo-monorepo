[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/BaseWrapper"](../modules/_wrappers_basewrapper_.md) › [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)

# Class: BaseWrapper <**T**>

**`internal`** -- use its children

## Type parameters

▪ **T**: *Contract*

## Hierarchy

* **BaseWrapper**

  ↳ [AccountsWrapper](_wrappers_accounts_.accountswrapper.md)

  ↳ [ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)

  ↳ [Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md)

  ↳ [BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)

  ↳ [MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)

  ↳ [BaseWrapperForGoverning](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md)

  ↳ [GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)

  ↳ [GrandaMentoWrapper](_wrappers_grandamento_.grandamentowrapper.md)

  ↳ [ReserveWrapper](_wrappers_reserve_.reservewrapper.md)

  ↳ [SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)

  ↳ [AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)

  ↳ [EpochRewardsWrapper](_wrappers_epochrewards_.epochrewardswrapper.md)

  ↳ [EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)

  ↳ [FreezerWrapper](_wrappers_freezer_.freezerwrapper.md)

  ↳ [MetaTransactionWalletWrapper](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)

  ↳ [MetaTransactionWalletDeployerWrapper](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md)

## Index

### Constructors

* [constructor](_wrappers_basewrapper_.basewrapper.md#constructor)

### Properties

* [eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)
* [events](_wrappers_basewrapper_.basewrapper.md#events)
* [methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)

### Accessors

* [address](_wrappers_basewrapper_.basewrapper.md#address)

### Methods

* [getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)
* [version](_wrappers_basewrapper_.basewrapper.md#version)

## Constructors

###  constructor

\+ **new BaseWrapper**(`connection`: Connection, `contract`: T): *[BaseWrapper](_wrappers_basewrapper_.basewrapper.md)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | T |

**Returns:** *[BaseWrapper](_wrappers_basewrapper_.basewrapper.md)*

## Properties

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L63)*

___

###  events

• **events**: *T["events"]* = this.contract.events

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

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L68)*

## Accessors

###  address

• **get address**(): *string*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹T›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹T› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
