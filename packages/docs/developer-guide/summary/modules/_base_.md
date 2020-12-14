# base

## Index

### Enumerations

* [CeloContract]()

### Type aliases

* [Address](_base_.md#address)
* [CeloToken](_base_.md#celotoken)

### Variables

* [AllContracts](_base_.md#const-allcontracts)
* [NULL\_ADDRESS](_base_.md#const-null_address)
* [ProxyContracts](_base_.md#const-proxycontracts)
* [RegisteredContracts](_base_.md#const-registeredcontracts)

## Type aliases

### Address

Ƭ **Address**: _string_

_Defined in_ [_packages/contractkit/src/base.ts:1_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L1)

### CeloToken

Ƭ **CeloToken**: [_GoldToken_]() _\|_ [_StableToken_]()

_Defined in_ [_packages/contractkit/src/base.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L33)

## Variables

### `Const` AllContracts

• **AllContracts**: [_CeloContract_]()_\[\]_ = Object.keys\(CeloContract\) as CeloContract\[\]

_Defined in_ [_packages/contractkit/src/base.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L35)

### `Const` NULL\_ADDRESS

• **NULL\_ADDRESS**: _string_ = '0x0000000000000000000000000000000000000000' as Address

_Defined in_ [_packages/contractkit/src/base.ts:43_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L43)

### `Const` ProxyContracts

• **ProxyContracts**: _string\[\]_ = Object.keys\(CeloContract\).map\(\(c\) =&gt; `${c}Proxy`\)

_Defined in_ [_packages/contractkit/src/base.ts:31_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L31)

### `Const` RegisteredContracts

• **RegisteredContracts**: [_CeloContract_]()_\[\]_ = AllContracts.filter\(\(v\) =&gt; !AuxiliaryContracts.includes\(v\)\)

_Defined in_ [_packages/contractkit/src/base.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L41)

