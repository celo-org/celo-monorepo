# LedgerWallet

## Hierarchy

↳ [RemoteWallet](_wallets_remote_wallet_.remotewallet.md)‹[LedgerSigner](_wallets_signers_ledger_signer_.ledgersigner.md)›

↳ **LedgerWallet**

## Implements

* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)
* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)
* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)

## Index

### Constructors

* [constructor](_wallets_ledger_wallet_.ledgerwallet.md#constructor)

### Properties

* [baseDerivationPath](_wallets_ledger_wallet_.ledgerwallet.md#readonly-basederivationpath)
* [derivationPathIndexes](_wallets_ledger_wallet_.ledgerwallet.md#readonly-derivationpathindexes)
* [ledgerAddressValidation](_wallets_ledger_wallet_.ledgerwallet.md#readonly-ledgeraddressvalidation)
* [transport](_wallets_ledger_wallet_.ledgerwallet.md#readonly-transport)

### Methods

* [computeSharedSecret](_wallets_ledger_wallet_.ledgerwallet.md#computesharedsecret)
* [decrypt](_wallets_ledger_wallet_.ledgerwallet.md#decrypt)
* [getAccounts](_wallets_ledger_wallet_.ledgerwallet.md#getaccounts)
* [hasAccount](_wallets_ledger_wallet_.ledgerwallet.md#hasaccount)
* [init](_wallets_ledger_wallet_.ledgerwallet.md#init)
* [isSetupFinished](_wallets_ledger_wallet_.ledgerwallet.md#issetupfinished)
* [removeAccount](_wallets_ledger_wallet_.ledgerwallet.md#removeaccount)
* [signPersonalMessage](_wallets_ledger_wallet_.ledgerwallet.md#signpersonalmessage)
* [signTransaction](_wallets_ledger_wallet_.ledgerwallet.md#signtransaction)
* [signTypedData](_wallets_ledger_wallet_.ledgerwallet.md#signtypeddata)

## Constructors

### constructor

+ **new LedgerWallet**\(`derivationPathIndexes`: number\[\], `baseDerivationPath`: string, `transport`: any, `ledgerAddressValidation`: [AddressValidation](../enums/_wallets_ledger_wallet_.addressvalidation.md)\): [_LedgerWallet_](_wallets_ledger_wallet_.ledgerwallet.md)

_Defined in_ [_packages/contractkit/src/wallets/ledger-wallet.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L46)

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `derivationPathIndexes` | number\[\] | zeroRange\(ADDRESS\_QTY\) | number array of "address\_index" for the base derivation path. Default: Array\[0..9\]. Example: \[3, 99, 53\] will retrieve the derivation paths of \[`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`\] |
| `baseDerivationPath` | string | CELO\_BASE\_DERIVATION\_PATH | base derivation path. Default: "44'/52752'/0'/0" |
| `transport` | any | {} | Transport to connect the ledger device |
| `ledgerAddressValidation` | [AddressValidation](../enums/_wallets_ledger_wallet_.addressvalidation.md) | AddressValidation.firstTransactionPerAddress | - |

**Returns:** [_LedgerWallet_](_wallets_ledger_wallet_.ledgerwallet.md)

## Properties

### `Readonly` baseDerivationPath

• **baseDerivationPath**: _string_

_Defined in_ [_packages/contractkit/src/wallets/ledger-wallet.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L58)

base derivation path. Default: "44'/52752'/0'/0"

### `Readonly` derivationPathIndexes

• **derivationPathIndexes**: _number\[\]_

_Defined in_ [_packages/contractkit/src/wallets/ledger-wallet.ts:57_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L57)

number array of "address\_index" for the base derivation path. Default: Array\[0..9\]. Example: \[3, 99, 53\] will retrieve the derivation paths of \[`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`\]

### `Readonly` ledgerAddressValidation

• **ledgerAddressValidation**: [_AddressValidation_](../enums/_wallets_ledger_wallet_.addressvalidation.md)

_Defined in_ [_packages/contractkit/src/wallets/ledger-wallet.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L60)

### `Readonly` transport

• **transport**: _any_

_Defined in_ [_packages/contractkit/src/wallets/ledger-wallet.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L59)

Transport to connect the ledger device

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`address`: [Address](../modules/_base_.md#address), `publicKey`: string\): _Promise‹Buffer›_

_Inherited from_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_computeSharedSecret_](_wallets_wallet_.walletbase.md#computesharedsecret)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L157)

Computes the shared secret \(an ECDH key exchange object\) between two accounts

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) |
| `publicKey` | string |

**Returns:** _Promise‹Buffer›_

### decrypt

▸ **decrypt**\(`address`: string, `ciphertext`: Buffer\): _Promise‹Buffer‹››_

_Inherited from_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_decrypt_](_wallets_wallet_.walletbase.md#decrypt)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:149_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L149)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `ciphertext` | Buffer |

**Returns:** _Promise‹Buffer‹››_

### getAccounts

▸ **getAccounts**\(\): [_Address_](../modules/_base_.md#address)_\[\]_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_getAccounts_](_wallets_remote_wallet_.remotewallet.md#getaccounts)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_getAccounts_](_wallets_wallet_.walletbase.md#getaccounts)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L62)

Get a list of accounts in the remote wallet

**Returns:** [_Address_](../modules/_base_.md#address)_\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: [Address](../modules/_base_.md#address)\): _boolean_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_hasAccount_](_wallets_remote_wallet_.remotewallet.md#hasaccount)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_hasAccount_](_wallets_wallet_.walletbase.md#hasaccount)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L71)

Returns true if account is in the remote wallet

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | [Address](../modules/_base_.md#address) | Account to check |

**Returns:** _boolean_

### init

▸ **init**\(\): _Promise‹void›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_init_](_wallets_remote_wallet_.remotewallet.md#init)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L21)

Discovers wallet accounts and caches results in memory Idempotent to ensure multiple calls are benign

**Returns:** _Promise‹void›_

### isSetupFinished

▸ **isSetupFinished**\(\): _boolean_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_isSetupFinished_](_wallets_remote_wallet_.remotewallet.md#issetupfinished)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:111_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L111)

**Returns:** _boolean_

### removeAccount

▸ **removeAccount**\(`_address`: string\): _void_

_Inherited from_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_removeAccount_](_wallets_wallet_.walletbase.md#removeaccount)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L52)

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_address` | string |

**Returns:** _void_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: [Address](../modules/_base_.md#address), `data`: string\): _Promise‹string›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_signPersonalMessage_](_wallets_remote_wallet_.remotewallet.md#signpersonalmessage)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signPersonalMessage_](_wallets_wallet_.walletbase.md#signpersonalmessage)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:90_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L90)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: Tx\): _Promise‹EncodedTransaction›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_signTransaction_](_wallets_remote_wallet_.remotewallet.md#signtransaction)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signTransaction_](_wallets_wallet_.walletbase.md#signtransaction)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:80_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L80)

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | Tx | EVM transaction |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: [Address](../modules/_base_.md#address), `typedData`: EIP712TypedData\): _Promise‹string›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_signTypedData_](_wallets_remote_wallet_.remotewallet.md#signtypeddata)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signTypedData_](_wallets_wallet_.walletbase.md#signtypeddata)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:100_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L100)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
| `typedData` | EIP712TypedData | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

