[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["base"](_base_.md)

# Module: "base"

## Index

### Enumerations

* [CeloContract](../enums/_base_.celocontract.md)

### Type aliases

* [CeloToken](_base_.md#celotoken)
* [CeloTokenContract](_base_.md#celotokencontract)
* [ExchangeContract](_base_.md#exchangecontract)
* [StableTokenContract](_base_.md#stabletokencontract)

### Variables

* [AllContracts](_base_.md#const-allcontracts)
* [ProxyContracts](_base_.md#const-proxycontracts)
* [RegisteredContracts](_base_.md#const-registeredcontracts)

### Functions

* [stripProxy](_base_.md#const-stripproxy)
* [suffixProxy](_base_.md#const-suffixproxy)

## Type aliases

###  CeloToken

Ƭ **CeloToken**: *[CeloTokenContract](_base_.md#celotokencontract)*

*Defined in [packages/sdk/contractkit/src/base.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L50)*

Deprecated alias for CeloTokenContract.

**`deprecated`** Use CeloTokenContract instead

___

###  CeloTokenContract

Ƭ **CeloTokenContract**: *[StableTokenContract](_base_.md#stabletokencontract) | [GoldToken](../enums/_base_.celocontract.md#goldtoken)*

*Defined in [packages/sdk/contractkit/src/base.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L45)*

___

###  ExchangeContract

Ƭ **ExchangeContract**: *[Exchange](../enums/_base_.celocontract.md#exchange) | [ExchangeEUR](../enums/_base_.celocontract.md#exchangeeur) | [ExchangeBRL](../enums/_base_.celocontract.md#exchangebrl)*

*Defined in [packages/sdk/contractkit/src/base.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L40)*

___

###  StableTokenContract

Ƭ **StableTokenContract**: *[StableToken](../enums/_base_.celocontract.md#stabletoken) | [StableTokenEUR](../enums/_base_.celocontract.md#stabletokeneur) | [StableTokenBRL](../enums/_base_.celocontract.md#stabletokenbrl)*

*Defined in [packages/sdk/contractkit/src/base.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L35)*

## Variables

### `Const` AllContracts

• **AllContracts**: *[CeloContract](../enums/_base_.celocontract.md)[]* = Object.keys(CeloContract) as CeloContract[]

*Defined in [packages/sdk/contractkit/src/base.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L52)*

___

### `Const` ProxyContracts

• **ProxyContracts**: *[CeloContract](../enums/_base_.celocontract.md)[]* = AllContracts.map((c) => suffixProxy(c))

*Defined in [packages/sdk/contractkit/src/base.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L68)*

___

### `Const` RegisteredContracts

• **RegisteredContracts**: *[CeloContract](../enums/_base_.celocontract.md)[]* = AllContracts.filter((v) => !AuxiliaryContracts.includes(v))

*Defined in [packages/sdk/contractkit/src/base.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L59)*

## Functions

### `Const` stripProxy

▸ **stripProxy**(`contract`: [CeloContract](../enums/_base_.celocontract.md)): *[CeloContract](../enums/_base_.celocontract.md)*

*Defined in [packages/sdk/contractkit/src/base.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L62)*

**`internal`** 

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [CeloContract](../enums/_base_.celocontract.md) |

**Returns:** *[CeloContract](../enums/_base_.celocontract.md)*

___

### `Const` suffixProxy

▸ **suffixProxy**(`contract`: [CeloContract](../enums/_base_.celocontract.md)): *[CeloContract](../enums/_base_.celocontract.md)*

*Defined in [packages/sdk/contractkit/src/base.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L65)*

**`internal`** 

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [CeloContract](../enums/_base_.celocontract.md) |

**Returns:** *[CeloContract](../enums/_base_.celocontract.md)*
