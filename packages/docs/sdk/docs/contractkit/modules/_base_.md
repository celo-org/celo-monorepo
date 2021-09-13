[@celo/contractkit](../README.md) › ["base"](_base_.md)

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

*Defined in [packages/sdk/contractkit/src/base.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L42)*

Deprecated alias for CeloTokenContract.

**`deprecated`** Use CeloTokenContract instead

___

###  CeloTokenContract

Ƭ **CeloTokenContract**: *[StableTokenContract](_base_.md#stabletokencontract) | [GoldToken](../enums/_base_.celocontract.md#goldtoken)*

*Defined in [packages/sdk/contractkit/src/base.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L37)*

___

###  ExchangeContract

Ƭ **ExchangeContract**: *[Exchange](../enums/_base_.celocontract.md#exchange) | [ExchangeEUR](../enums/_base_.celocontract.md#exchangeeur)*

*Defined in [packages/sdk/contractkit/src/base.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L35)*

___

###  StableTokenContract

Ƭ **StableTokenContract**: *[StableToken](../enums/_base_.celocontract.md#stabletoken) | [StableTokenEUR](../enums/_base_.celocontract.md#stabletokeneur)*

*Defined in [packages/sdk/contractkit/src/base.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L33)*

## Variables

### `Const` AllContracts

• **AllContracts**: *[CeloContract](../enums/_base_.celocontract.md)[]* = Object.keys(CeloContract) as CeloContract[]

*Defined in [packages/sdk/contractkit/src/base.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L44)*

___

### `Const` ProxyContracts

• **ProxyContracts**: *[CeloContract](../enums/_base_.celocontract.md)[]* = AllContracts.map((c) => suffixProxy(c))

*Defined in [packages/sdk/contractkit/src/base.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L58)*

___

### `Const` RegisteredContracts

• **RegisteredContracts**: *[CeloContract](../enums/_base_.celocontract.md)[]* = AllContracts.filter((v) => !AuxiliaryContracts.includes(v))

*Defined in [packages/sdk/contractkit/src/base.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L51)*

## Functions

### `Const` stripProxy

▸ **stripProxy**(`contract`: [CeloContract](../enums/_base_.celocontract.md)): *[CeloContract](../enums/_base_.celocontract.md)*

*Defined in [packages/sdk/contractkit/src/base.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [CeloContract](../enums/_base_.celocontract.md) |

**Returns:** *[CeloContract](../enums/_base_.celocontract.md)*

___

### `Const` suffixProxy

▸ **suffixProxy**(`contract`: [CeloContract](../enums/_base_.celocontract.md)): *[CeloContract](../enums/_base_.celocontract.md)*

*Defined in [packages/sdk/contractkit/src/base.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [CeloContract](../enums/_base_.celocontract.md) |

**Returns:** *[CeloContract](../enums/_base_.celocontract.md)*
