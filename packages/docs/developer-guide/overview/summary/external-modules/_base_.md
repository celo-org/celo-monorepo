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

## Type aliases

### Address

Ƭ **Address**: _string_

_Defined in_ [_contractkit/src/base.ts:1_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L1)

### CeloToken

Ƭ **CeloToken**: [_GoldToken_]() _\|_ [_StableToken_]()

_Defined in_ [_contractkit/src/base.ts:53_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L53)

## Variables

### `Const` AllContracts

• **AllContracts**: [_CeloContract_]()_\[\]_ = Object.keys\(CeloContract\).map\( \(k\) =&gt; \(CeloContract as any\)\[k as any\] \) as CeloContract\[\]

_Defined in_ [_contractkit/src/base.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L55)

### `Const` NULL\_ADDRESS

• **NULL\_ADDRESS**: _string_ = '0x0000000000000000000000000000000000000000' as Address

_Defined in_ [_contractkit/src/base.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L59)

### `Const` ProxyContracts

• **ProxyContracts**: _string\[\]_ = \[ 'AccountsProxy', 'AttestationsProxy', 'BlockchainParametersProxy', 'DoubleSigningSlasherProxy', 'DowntimeSlasherProxy', 'ElectionProxy', 'EpochRewardsProxy', 'EscrowProxy', 'ExchangeProxy', 'FeeCurrencyWhitelistProxy', 'FreezerProxy', 'GasPriceMinimumProxy', 'GoldTokenProxy', 'GovernanceApproverMultiSigProxy', 'GovernanceProxy', 'LockedGoldProxy', 'ReserveProxy', 'ReserveSpenderMultiSigProxy', 'StableTokenProxy', 'SortedOraclesProxy', 'RegistryProxy', \]

_Defined in_ [_contractkit/src/base.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/base.ts#L29)

