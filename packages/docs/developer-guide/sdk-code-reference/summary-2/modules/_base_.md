# base

## Index

### Enumerations

* [CeloContract]()

### Type aliases

* [CeloToken](_base_.md#celotoken)

### Variables

* [AllContracts](_base_.md#const-allcontracts)
* [ProxyContracts](_base_.md#const-proxycontracts)
* [RegisteredContracts](_base_.md#const-registeredcontracts)

## Type aliases

### CeloToken

Ƭ **CeloToken**: [_GoldToken_]() _\|_ [_StableToken_]()

_Defined in_ [_contractkit/src/base.ts:31_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L31)

## Variables

### `Const` AllContracts

• **AllContracts**: [_CeloContract_]()_\[\]_ = Object.keys\(CeloContract\) as CeloContract\[\]

_Defined in_ [_contractkit/src/base.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L33)

### `Const` ProxyContracts

• **ProxyContracts**: _string\[\]_ = Object.keys\(CeloContract\).map\(\(c\) =&gt; `${c}Proxy`\)

_Defined in_ [_contractkit/src/base.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L29)

### `Const` RegisteredContracts

• **RegisteredContracts**: [_CeloContract_]()_\[\]_ = AllContracts.filter\(\(v\) =&gt; !AuxiliaryContracts.includes\(v\)\)

_Defined in_ [_contractkit/src/base.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/base.ts#L39)

