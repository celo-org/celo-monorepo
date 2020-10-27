# External module: "contractkit/src/base"

## Index

### Enumerations

* [CeloContract](../enums/_contractkit_src_base_.celocontract.md)

### Type aliases

* [Address](_contractkit_src_base_.md#address)
* [CeloToken](_contractkit_src_base_.md#celotoken)

### Variables

* [AllContracts](_contractkit_src_base_.md#const-allcontracts)
* [NULL_ADDRESS](_contractkit_src_base_.md#const-null_address)
* [ProxyContracts](_contractkit_src_base_.md#const-proxycontracts)
* [RegisteredContracts](_contractkit_src_base_.md#const-registeredcontracts)

## Type aliases

###  Address

Ƭ **Address**: *string*

*Defined in [packages/contractkit/src/base.ts:1](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L1)*

___

###  CeloToken

Ƭ **CeloToken**: *[GoldToken](../enums/_contractkit_src_base_.celocontract.md#goldtoken) | [StableToken](../enums/_contractkit_src_base_.celocontract.md#stabletoken)*

*Defined in [packages/contractkit/src/base.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L33)*

## Variables

### `Const` AllContracts

• **AllContracts**: *[CeloContract](../enums/_contractkit_src_base_.celocontract.md)[]* = Object.keys(CeloContract) as CeloContract[]

*Defined in [packages/contractkit/src/base.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L35)*

___

### `Const` NULL_ADDRESS

• **NULL_ADDRESS**: *string* = '0x0000000000000000000000000000000000000000' as Address

*Defined in [packages/contractkit/src/base.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L43)*

___

### `Const` ProxyContracts

• **ProxyContracts**: *string[]* = Object.keys(CeloContract).map((c) => `${c}Proxy`)

*Defined in [packages/contractkit/src/base.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L31)*

___

### `Const` RegisteredContracts

• **RegisteredContracts**: *[CeloContract](../enums/_contractkit_src_base_.celocontract.md)[]* = AllContracts.filter((v) => !AuxiliaryContracts.includes(v))

*Defined in [packages/contractkit/src/base.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L41)*
