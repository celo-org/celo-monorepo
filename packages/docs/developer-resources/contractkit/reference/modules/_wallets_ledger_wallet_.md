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

*Defined in [contractkit/src/wallets/ledger-wallet.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L20)*

## Functions

###  newLedgerWalletWithSetup

▸ **newLedgerWalletWithSetup**(`derivationPathIndexes?`: number[], `baseDerivationPath?`: undefined | string, `transport?`: any): *Promise‹[LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)›*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`derivationPathIndexes?` | number[] |
`baseDerivationPath?` | undefined &#124; string |
`transport?` | any |

**Returns:** *Promise‹[LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)›*
