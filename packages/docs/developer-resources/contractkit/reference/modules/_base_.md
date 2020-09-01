# External module: "base"

## Index

### Enumerations

* [CeloContract](../enums/_base_.celocontract.md)

### Type aliases

* [Address](_base_.md#address)
* [CeloToken](_base_.md#celotoken)

### Variables

* [AllContracts](_base_.md#const-allcontracts)
* [NULL_ADDRESS](_base_.md#const-null_address)
* [ProxyContracts](_base_.md#const-proxycontracts)

## Type aliases

###  Address

Ƭ **Address**: *string*

*Defined in [packages/contractkit/src/base.ts:1](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L1)*

___

###  CeloToken

Ƭ **CeloToken**: *[GoldToken](../enums/_base_.celocontract.md#goldtoken) | [StableToken](../enums/_base_.celocontract.md#stabletoken)*

*Defined in [packages/contractkit/src/base.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L31)*

## Variables

### `Const` AllContracts

• **AllContracts**: *[CeloContract](../enums/_base_.celocontract.md)[]* = Object.keys(CeloContract).map(
  (k) => (CeloContract as any)[k as any]
) as CeloContract[]

*Defined in [packages/contractkit/src/base.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L33)*

___

### `Const` NULL_ADDRESS

• **NULL_ADDRESS**: *string* = '0x0000000000000000000000000000000000000000' as Address

*Defined in [packages/contractkit/src/base.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L37)*

___

### `Const` ProxyContracts

• **ProxyContracts**: *string[]* = Object.keys(CeloContract).map((c) => `${c}Proxy`)

*Defined in [packages/contractkit/src/base.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L29)*
