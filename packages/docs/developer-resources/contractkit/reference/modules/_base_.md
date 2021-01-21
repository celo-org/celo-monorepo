# Module: "base"

## Index

### Enumerations

* [CeloContract](../enums/_base_.celocontract.md)

### Type aliases

* [CeloToken](_base_.md#celotoken)

### Variables

* [AllContracts](_base_.md#const-allcontracts)
* [ProxyContracts](_base_.md#const-proxycontracts)
* [RegisteredContracts](_base_.md#const-registeredcontracts)

## Type aliases

###  CeloToken

Ƭ **CeloToken**: *[GoldToken](../enums/_base_.celocontract.md#goldtoken) | [StableToken](../enums/_base_.celocontract.md#stabletoken)*

*Defined in [contractkit/src/base.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L31)*

## Variables

### `Const` AllContracts

• **AllContracts**: *[CeloContract](../enums/_base_.celocontract.md)[]* = Object.keys(CeloContract) as CeloContract[]

*Defined in [contractkit/src/base.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L33)*

___

### `Const` ProxyContracts

• **ProxyContracts**: *string[]* = Object.keys(CeloContract).map((c) => `${c}Proxy`)

*Defined in [contractkit/src/base.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L29)*

___

### `Const` RegisteredContracts

• **RegisteredContracts**: *[CeloContract](../enums/_base_.celocontract.md)[]* = AllContracts.filter((v) => !AuxiliaryContracts.includes(v))

*Defined in [contractkit/src/base.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L39)*
