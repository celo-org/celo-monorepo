# External module: "wallets/ledger-wallet"

## Index

### Classes

* [LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)

### Variables

* [CELO_BASE_DERIVATION_PATH](_wallets_ledger_wallet_.md#const-celo_base_derivation_path)

### Functions

* [newLedgerWalletWithSetup](_wallets_ledger_wallet_.md#newledgerwalletwithsetup)

## Variables

### `Const` CELO_BASE_DERIVATION_PATH

• **CELO_BASE_DERIVATION_PATH**: *"44'/52752'/0'/0"* = "44'/52752'/0'/0"

*Defined in [contractkit/src/wallets/ledger-wallet.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L18)*

## Functions

###  newLedgerWalletWithSetup

▸ **newLedgerWalletWithSetup**(`transport`: any, `derivationPathIndexes?`: number[], `baseDerivationPath?`: undefined | string): *Promise‹[LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)›*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`transport` | any |
`derivationPathIndexes?` | number[] |
`baseDerivationPath?` | undefined &#124; string |

**Returns:** *Promise‹[LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)›*
