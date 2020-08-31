# External module: "wallets/ledger-wallet"

## Index

### Enumerations

* [AddressValidation](../enums/_wallets_ledger_wallet_.addressvalidation.md)

### Classes

* [LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)

### Variables

* [CELO_BASE_DERIVATION_PATH](_wallets_ledger_wallet_.md#const-celo_base_derivation_path)

### Functions

* [newLedgerWalletWithSetup](_wallets_ledger_wallet_.md#newledgerwalletwithsetup)

## Variables

### `Const` CELO_BASE_DERIVATION_PATH

• **CELO_BASE_DERIVATION_PATH**: *string* = CELO_DERIVATION_PATH_BASE.slice(2)

*Defined in [contractkit/src/wallets/ledger-wallet.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L12)*

## Functions

###  newLedgerWalletWithSetup

▸ **newLedgerWalletWithSetup**(`transport`: any, `derivationPathIndexes?`: number[], `baseDerivationPath?`: undefined | string, `ledgerAddressValidation?`: [AddressValidation](../enums/_wallets_ledger_wallet_.addressvalidation.md)): *Promise‹[LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)›*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`transport` | any |
`derivationPathIndexes?` | number[] |
`baseDerivationPath?` | undefined &#124; string |
`ledgerAddressValidation?` | [AddressValidation](../enums/_wallets_ledger_wallet_.addressvalidation.md) |

**Returns:** *Promise‹[LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)›*
