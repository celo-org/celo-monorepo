# External module: "contractkit/src/wallets/ledger-wallet"

## Index

### Enumerations

* [AddressValidation](../enums/_contractkit_src_wallets_ledger_wallet_.addressvalidation.md)

### Classes

* [LedgerWallet](../classes/_contractkit_src_wallets_ledger_wallet_.ledgerwallet.md)

### Variables

* [CELO_BASE_DERIVATION_PATH](_contractkit_src_wallets_ledger_wallet_.md#const-celo_base_derivation_path)

### Functions

* [newLedgerWalletWithSetup](_contractkit_src_wallets_ledger_wallet_.md#newledgerwalletwithsetup)

## Variables

### `Const` CELO_BASE_DERIVATION_PATH

• **CELO_BASE_DERIVATION_PATH**: *string* = CELO_DERIVATION_PATH_BASE.slice(2)

*Defined in [contractkit/src/wallets/ledger-wallet.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L13)*

## Functions

###  newLedgerWalletWithSetup

▸ **newLedgerWalletWithSetup**(`transport`: any, `derivationPathIndexes?`: number[], `baseDerivationPath?`: undefined | string, `ledgerAddressValidation?`: [AddressValidation](../enums/_contractkit_src_wallets_ledger_wallet_.addressvalidation.md)): *Promise‹[LedgerWallet](../classes/_contractkit_src_wallets_ledger_wallet_.ledgerwallet.md)›*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`transport` | any |
`derivationPathIndexes?` | number[] |
`baseDerivationPath?` | undefined &#124; string |
`ledgerAddressValidation?` | [AddressValidation](../enums/_contractkit_src_wallets_ledger_wallet_.addressvalidation.md) |

**Returns:** *Promise‹[LedgerWallet](../classes/_contractkit_src_wallets_ledger_wallet_.ledgerwallet.md)›*
