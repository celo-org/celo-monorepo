# ledger-wallet

## Index

### Enumerations

* [AddressValidation]()

### Classes

* [LedgerWallet]()

### Variables

* [CELO\_BASE\_DERIVATION\_PATH](_ledger_wallet_.md#const-celo_base_derivation_path)

### Functions

* [newLedgerWalletWithSetup](_ledger_wallet_.md#newledgerwalletwithsetup)

## Variables

### `Const` CELO\_BASE\_DERIVATION\_PATH

• **CELO\_BASE\_DERIVATION\_PATH**: _string_ = `${CELO_DERIVATION_PATH_BASE.slice(2)}/0`

_Defined in_ [_wallet-ledger/src/ledger-wallet.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L11)

## Functions

### newLedgerWalletWithSetup

▸ **newLedgerWalletWithSetup**\(`transport`: any, `derivationPathIndexes?`: number\[\], `baseDerivationPath?`: undefined \| string, `ledgerAddressValidation?`: [AddressValidation]()\): _Promise‹_[_LedgerWallet_]()_›_

_Defined in_ [_wallet-ledger/src/ledger-wallet.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `transport` | any |
| `derivationPathIndexes?` | number\[\] |
| `baseDerivationPath?` | undefined \| string |
| `ledgerAddressValidation?` | [AddressValidation]() |

**Returns:** _Promise‹_[_LedgerWallet_]()_›_

