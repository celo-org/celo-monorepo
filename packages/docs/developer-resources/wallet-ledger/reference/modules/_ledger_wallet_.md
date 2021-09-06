# Module: "ledger-wallet"

## Index

### Enumerations

* [AddressValidation](../enums/_ledger_wallet_.addressvalidation.md)

### Classes

* [LedgerWallet](../classes/_ledger_wallet_.ledgerwallet.md)

### Variables

* [CELO_BASE_DERIVATION_PATH](_ledger_wallet_.md#const-celo_base_derivation_path)

### Functions

* [newLedgerWalletWithSetup](_ledger_wallet_.md#newledgerwalletwithsetup)

## Variables

### `Const` CELO_BASE_DERIVATION_PATH

• **CELO_BASE_DERIVATION_PATH**: *string* = `${CELO_DERIVATION_PATH_BASE.slice(2)}/0`

*Defined in [wallet-ledger/src/ledger-wallet.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L11)*

## Functions

###  newLedgerWalletWithSetup

▸ **newLedgerWalletWithSetup**(`transport`: any, `derivationPathIndexes?`: number[], `baseDerivationPath?`: undefined | string, `ledgerAddressValidation?`: [AddressValidation](../enums/_ledger_wallet_.addressvalidation.md)): *Promise‹[LedgerWallet](../classes/_ledger_wallet_.ledgerwallet.md)›*

*Defined in [wallet-ledger/src/ledger-wallet.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`transport` | any |
`derivationPathIndexes?` | number[] |
`baseDerivationPath?` | undefined &#124; string |
`ledgerAddressValidation?` | [AddressValidation](../enums/_ledger_wallet_.addressvalidation.md) |

**Returns:** *Promise‹[LedgerWallet](../classes/_ledger_wallet_.ledgerwallet.md)›*
