# LedgerWallet

## Hierarchy

↳ [RemoteWallet](_wallets_remote_wallet_.remotewallet.md)

↳ **LedgerWallet**

## Implements

* [Wallet](../interfaces/_wallets_wallet_.wallet.md)
* [Wallet](../interfaces/_wallets_wallet_.wallet.md)
* [Wallet](../interfaces/_wallets_wallet_.wallet.md)

## Index

### Constructors

* [constructor](_wallets_ledger_wallet_.ledgerwallet.md#constructor)

### Properties

* [baseDerivationPath](_wallets_ledger_wallet_.ledgerwallet.md#basederivationpath)
* [derivationPathIndexes](_wallets_ledger_wallet_.ledgerwallet.md#derivationpathindexes)
* [ledgerAddressValidation](_wallets_ledger_wallet_.ledgerwallet.md#ledgeraddressvalidation)
* [transport](_wallets_ledger_wallet_.ledgerwallet.md#transport)

### Methods

* [getAccounts](_wallets_ledger_wallet_.ledgerwallet.md#getaccounts)
* [hasAccount](_wallets_ledger_wallet_.ledgerwallet.md#hasaccount)
* [init](_wallets_ledger_wallet_.ledgerwallet.md#init)
* [signPersonalMessage](_wallets_ledger_wallet_.ledgerwallet.md#signpersonalmessage)
* [signTransaction](_wallets_ledger_wallet_.ledgerwallet.md#signtransaction)
* [signTypedData](_wallets_ledger_wallet_.ledgerwallet.md#signtypeddata)

## Constructors

### constructor

+ **new LedgerWallet**\(`derivationPathIndexes`: number\[\], `baseDerivationPath`: string, `transport`: any, `ledgerAddressValidation`: [AddressValidation](../enums/_wallets_ledger_wallet_.addressvalidation.md)\): [_LedgerWallet_](_wallets_ledger_wallet_.ledgerwallet.md)

_Defined in_ [_contractkit/src/wallets/ledger-wallet.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L46)

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `derivationPathIndexes` | number\[\] | Array.from\(Array\(ADDRESS\_QTY\).keys\(\)\) | number array of "address\_index" for the base derivation path. Default: Array\[0..9\]. Example: \[3, 99, 53\] will retrieve the derivation paths of \[`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`\] |
| `baseDerivationPath` | string | CELO\_BASE\_DERIVATION\_PATH | base derivation path. Default: "44'/52752'/0'/0" |
| `transport` | any | {} | Transport to connect the ledger device |
| `ledgerAddressValidation` | [AddressValidation](../enums/_wallets_ledger_wallet_.addressvalidation.md) | AddressValidation.firstTransactionPerAddress | - |

**Returns:** [_LedgerWallet_](_wallets_ledger_wallet_.ledgerwallet.md)

## Properties

### baseDerivationPath

• **baseDerivationPath**: _string_

_Defined in_ [_contractkit/src/wallets/ledger-wallet.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L58)

base derivation path. Default: "44'/52752'/0'/0"

### derivationPathIndexes

• **derivationPathIndexes**: _number\[\]_

_Defined in_ [_contractkit/src/wallets/ledger-wallet.ts:57_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L57)

number array of "address\_index" for the base derivation path. Default: Array\[0..9\]. Example: \[3, 99, 53\] will retrieve the derivation paths of \[`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`\]

### ledgerAddressValidation

• **ledgerAddressValidation**: [_AddressValidation_](../enums/_wallets_ledger_wallet_.addressvalidation.md)

_Defined in_ [_contractkit/src/wallets/ledger-wallet.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L60)

### transport

• **transport**: _any_

_Defined in_ [_contractkit/src/wallets/ledger-wallet.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L59)

Transport to connect the ledger device

## Methods

### getAccounts

▸ **getAccounts**\(\): [_Address_](../external-modules/_base_.md#address)_\[\]_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_getAccounts_](_wallets_remote_wallet_.remotewallet.md#getaccounts)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_getAccounts_](_wallets_wallet_.walletbase.md#getaccounts)

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L61)

Get a list of accounts in the remote wallet

**Returns:** [_Address_](../external-modules/_base_.md#address)_\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: [Address](../external-modules/_base_.md#address)\): _boolean_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_hasAccount_](_wallets_remote_wallet_.remotewallet.md#hasaccount)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_hasAccount_](_wallets_wallet_.walletbase.md#hasaccount)

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L70)

Returns true if account is in the remote wallet

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | [Address](../external-modules/_base_.md#address) | Account to check |

**Returns:** _boolean_

### init

▸ **init**\(\): _Promise‹void›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_init_](_wallets_remote_wallet_.remotewallet.md#init)

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L20)

Discovers wallet accounts and caches results in memory Idempotent to ensure multiple calls are benign

**Returns:** _Promise‹void›_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: [Address](../external-modules/_base_.md#address), `data`: string\): _Promise‹string›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_signPersonalMessage_](_wallets_remote_wallet_.remotewallet.md#signpersonalmessage)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signPersonalMessage_](_wallets_wallet_.walletbase.md#signpersonalmessage)

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:89_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L89)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../external-modules/_base_.md#address) | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: Tx\): _Promise‹EncodedTransaction›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_signTransaction_](_wallets_remote_wallet_.remotewallet.md#signtransaction)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signTransaction_](_wallets_wallet_.walletbase.md#signtransaction)

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:79_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L79)

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | Tx | EVM transaction |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: [Address](../external-modules/_base_.md#address), `typedData`: [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md)\): _Promise‹string›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_signTypedData_](_wallets_remote_wallet_.remotewallet.md#signtypeddata)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signTypedData_](_wallets_wallet_.walletbase.md#signtypeddata)

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L99)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../external-modules/_base_.md#address) | Address of the account to sign with |
| `typedData` | [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md) | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

