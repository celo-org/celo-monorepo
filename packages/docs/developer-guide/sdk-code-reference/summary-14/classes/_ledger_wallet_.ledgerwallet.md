# LedgerWallet

## Hierarchy

* RemoteWallet‹[LedgerSigner](_ledger_signer_.ledgersigner.md)›

  ↳ **LedgerWallet**

## Implements

* ReadOnlyWallet
* ReadOnlyWallet
* ReadOnlyWallet

## Index

### Constructors

* [constructor](_ledger_wallet_.ledgerwallet.md#constructor)

### Properties

* [baseDerivationPath](_ledger_wallet_.ledgerwallet.md#readonly-basederivationpath)
* [derivationPathIndexes](_ledger_wallet_.ledgerwallet.md#readonly-derivationpathindexes)
* [isSetupFinished](_ledger_wallet_.ledgerwallet.md#issetupfinished)
* [ledgerAddressValidation](_ledger_wallet_.ledgerwallet.md#readonly-ledgeraddressvalidation)
* [transport](_ledger_wallet_.ledgerwallet.md#readonly-transport)

### Methods

* [computeSharedSecret](_ledger_wallet_.ledgerwallet.md#computesharedsecret)
* [decrypt](_ledger_wallet_.ledgerwallet.md#decrypt)
* [getAccounts](_ledger_wallet_.ledgerwallet.md#getaccounts)
* [hasAccount](_ledger_wallet_.ledgerwallet.md#hasaccount)
* [init](_ledger_wallet_.ledgerwallet.md#init)
* [removeAccount](_ledger_wallet_.ledgerwallet.md#removeaccount)
* [signPersonalMessage](_ledger_wallet_.ledgerwallet.md#signpersonalmessage)
* [signTransaction](_ledger_wallet_.ledgerwallet.md#signtransaction)
* [signTypedData](_ledger_wallet_.ledgerwallet.md#signtypeddata)

## Constructors

### constructor

+ **new LedgerWallet**\(`derivationPathIndexes`: number\[\], `baseDerivationPath`: string, `transport`: any, `ledgerAddressValidation`: [AddressValidation](../enums/_ledger_wallet_.addressvalidation.md)\): [_LedgerWallet_](_ledger_wallet_.ledgerwallet.md)

_Defined in_ [_wallet-ledger/src/ledger-wallet.ts:45_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L45)

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `derivationPathIndexes` | number\[\] | zeroRange\(ADDRESS\_QTY\) | number array of "address\_index" for the base derivation path. Default: Array\[0..9\]. Example: \[3, 99, 53\] will retrieve the derivation paths of \[`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`\] |
| `baseDerivationPath` | string | CELO\_BASE\_DERIVATION\_PATH | base derivation path. Default: "44'/52752'/0'/0" |
| `transport` | any | {} | Transport to connect the ledger device |
| `ledgerAddressValidation` | [AddressValidation](../enums/_ledger_wallet_.addressvalidation.md) | AddressValidation.firstTransactionPerAddress | - |

**Returns:** [_LedgerWallet_](_ledger_wallet_.ledgerwallet.md)

## Properties

### `Readonly` baseDerivationPath

• **baseDerivationPath**: _string_

_Defined in_ [_wallet-ledger/src/ledger-wallet.ts:57_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L57)

base derivation path. Default: "44'/52752'/0'/0"

### `Readonly` derivationPathIndexes

• **derivationPathIndexes**: _number\[\]_

_Defined in_ [_wallet-ledger/src/ledger-wallet.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L56)

number array of "address\_index" for the base derivation path. Default: Array\[0..9\]. Example: \[3, 99, 53\] will retrieve the derivation paths of \[`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`\]

### isSetupFinished

• **isSetupFinished**: _function_

_Inherited from_ [_LedgerWallet_](_ledger_wallet_.ledgerwallet.md)_._[_isSetupFinished_](_ledger_wallet_.ledgerwallet.md#issetupfinished)

Defined in wallet-remote/lib/remote-wallet.d.ts:51

#### Type declaration:

▸ \(\): _boolean_

### `Readonly` ledgerAddressValidation

• **ledgerAddressValidation**: [_AddressValidation_](../enums/_ledger_wallet_.addressvalidation.md)

_Defined in_ [_wallet-ledger/src/ledger-wallet.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L59)

### `Readonly` transport

• **transport**: _any_

_Defined in_ [_wallet-ledger/src/ledger-wallet.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L58)

Transport to connect the ledger device

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`address`: Address, `publicKey`: string\): _Promise‹Buffer›_

_Inherited from_ [_LedgerWallet_](_ledger_wallet_.ledgerwallet.md)_._[_computeSharedSecret_](_ledger_wallet_.ledgerwallet.md#computesharedsecret)

Defined in wallet-base/lib/wallet-base.d.ts:64

Computes the shared secret \(an ECDH key exchange object\) between two accounts

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |
| `publicKey` | string |

**Returns:** _Promise‹Buffer›_

### decrypt

▸ **decrypt**\(`address`: string, `ciphertext`: Buffer\): _Promise‹Buffer›_

_Inherited from_ [_LedgerWallet_](_ledger_wallet_.ledgerwallet.md)_._[_decrypt_](_ledger_wallet_.ledgerwallet.md#decrypt)

Defined in wallet-base/lib/wallet-base.d.ts:60

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `ciphertext` | Buffer |

**Returns:** _Promise‹Buffer›_

### getAccounts

▸ **getAccounts**\(\): _Address\[\]_

_Inherited from_ [_LedgerWallet_](_ledger_wallet_.ledgerwallet.md)_._[_getAccounts_](_ledger_wallet_.ledgerwallet.md#getaccounts)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:27

Get a list of accounts in the remote wallet

**Returns:** _Address\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: Address\): _boolean_

_Inherited from_ [_LedgerWallet_](_ledger_wallet_.ledgerwallet.md)_._[_hasAccount_](_ledger_wallet_.ledgerwallet.md#hasaccount)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:32

Returns true if account is in the remote wallet

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | Address | Account to check |

**Returns:** _boolean_

### init

▸ **init**\(\): _Promise‹void›_

_Inherited from_ [_LedgerWallet_](_ledger_wallet_.ledgerwallet.md)_._[_init_](_ledger_wallet_.ledgerwallet.md#init)

Defined in wallet-remote/lib/remote-wallet.d.ts:15

Discovers wallet accounts and caches results in memory Idempotent to ensure multiple calls are benign

**Returns:** _Promise‹void›_

### removeAccount

▸ **removeAccount**\(`_address`: string\): _void_

_Inherited from_ [_LedgerWallet_](_ledger_wallet_.ledgerwallet.md)_._[_removeAccount_](_ledger_wallet_.ledgerwallet.md#removeaccount)

Defined in wallet-base/lib/wallet-base.d.ts:23

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_address` | string |

**Returns:** _void_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: Address, `data`: string\): _Promise‹string›_

_Inherited from_ [_LedgerWallet_](_ledger_wallet_.ledgerwallet.md)_._[_signPersonalMessage_](_ledger_wallet_.ledgerwallet.md#signpersonalmessage)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:43

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: CeloTx\): _Promise‹EncodedTransaction›_

_Inherited from_ [_LedgerWallet_](_ledger_wallet_.ledgerwallet.md)_._[_signTransaction_](_ledger_wallet_.ledgerwallet.md#signtransaction)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:37

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | CeloTx | EVM transaction |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: Address, `typedData`: EIP712TypedData\): _Promise‹string›_

_Inherited from_ [_LedgerWallet_](_ledger_wallet_.ledgerwallet.md)_._[_signTypedData_](_ledger_wallet_.ledgerwallet.md#signtypeddata)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:49

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Address of the account to sign with |
| `typedData` | EIP712TypedData | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

