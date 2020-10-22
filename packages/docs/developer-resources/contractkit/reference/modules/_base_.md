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
* [RegisteredContracts](_base_.md#const-registeredcontracts)

## Type aliases

###  Address

Ƭ **Address**: *string*

*Defined in [packages/contractkit/src/base.ts:1](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L1)*

___

###  CeloToken

Ƭ **CeloToken**: *[GoldToken](../enums/_base_.celocontract.md#goldtoken) | [StableToken](../enums/_base_.celocontract.md#stabletoken)*

*Defined in [packages/contractkit/src/base.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L32)*

## Variables

### `Const` AllContracts

• **AllContracts**: *[CeloContract](../enums/_base_.celocontract.md)[]* = Object.keys(CeloContract) as CeloContract[]

*Defined in [packages/contractkit/src/base.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L34)*

___

### `Const` NULL_ADDRESS

• **NULL_ADDRESS**: *string* = '0x0000000000000000000000000000000000000000' as Address

*Defined in [packages/contractkit/src/base.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L38)*

___

### `Const` ProxyContracts

• **ProxyContracts**: *string[]* = Object.keys(CeloContract).map((c) => `${c}Proxy`)

*Defined in [packages/contractkit/src/base.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L30)*

___

### `Const` RegisteredContracts

• **RegisteredContracts**: *[CeloContract](../enums/_base_.celocontract.md)[]* = AllContracts.filter((v) => !AuxiliaryContracts.includes(v))

*Defined in [packages/contractkit/src/base.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L36)*
