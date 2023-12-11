[@celo/wallet-ledger](../README.md) › ["ledger-wallet"](../modules/_ledger_wallet_.md) › [LedgerWallet](_ledger_wallet_.ledgerwallet.md)

# Class: LedgerWallet

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

###  constructor

\+ **new LedgerWallet**(`derivationPathIndexes`: number[], `baseDerivationPath`: string, `transport`: any, `ledgerAddressValidation`: [AddressValidation](../enums/_ledger_wallet_.addressvalidation.md)): *[LedgerWallet](_ledger_wallet_.ledgerwallet.md)*

*Defined in [wallet-ledger/src/ledger-wallet.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L45)*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`derivationPathIndexes` | number[] | zeroRange(ADDRESS_QTY) | number array of "address_index" for the base derivation path. Default: Array[0..9]. Example: [3, 99, 53] will retrieve the derivation paths of [`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`] |
`baseDerivationPath` | string | CELO_BASE_DERIVATION_PATH | base derivation path. Default: "44'/52752'/0'/0" |
`transport` | any | {} | Transport to connect the ledger device  |
`ledgerAddressValidation` | [AddressValidation](../enums/_ledger_wallet_.addressvalidation.md) | AddressValidation.firstTransactionPerAddress | - |

**Returns:** *[LedgerWallet](_ledger_wallet_.ledgerwallet.md)*

## Properties

### `Readonly` baseDerivationPath

• **baseDerivationPath**: *string*

*Defined in [wallet-ledger/src/ledger-wallet.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L57)*

base derivation path. Default: "44'/52752'/0'/0"

___

### `Readonly` derivationPathIndexes

• **derivationPathIndexes**: *number[]*

*Defined in [wallet-ledger/src/ledger-wallet.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L56)*

number array of "address_index" for the base derivation path.
Default: Array[0..9].
Example: [3, 99, 53] will retrieve the derivation paths of
[`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`]

___

###  isSetupFinished

• **isSetupFinished**: *function*

*Inherited from [LedgerWallet](_ledger_wallet_.ledgerwallet.md).[isSetupFinished](_ledger_wallet_.ledgerwallet.md#issetupfinished)*

Defined in wallet-remote/lib/remote-wallet.d.ts:51

#### Type declaration:

▸ (): *boolean*

___

### `Readonly` ledgerAddressValidation

• **ledgerAddressValidation**: *[AddressValidation](../enums/_ledger_wallet_.addressvalidation.md)*

*Defined in [wallet-ledger/src/ledger-wallet.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L59)*

___

### `Readonly` transport

• **transport**: *any*

*Defined in [wallet-ledger/src/ledger-wallet.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L58)*

Transport to connect the ledger device

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`address`: Address, `publicKey`: string): *Promise‹Buffer›*

*Inherited from [LedgerWallet](_ledger_wallet_.ledgerwallet.md).[computeSharedSecret](_ledger_wallet_.ledgerwallet.md#computesharedsecret)*

Defined in wallet-base/lib/wallet-base.d.ts:64

Computes the shared secret (an ECDH key exchange object) between two accounts

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |
`publicKey` | string |

**Returns:** *Promise‹Buffer›*

___

###  decrypt

▸ **decrypt**(`address`: string, `ciphertext`: Buffer): *Promise‹Buffer›*

*Inherited from [LedgerWallet](_ledger_wallet_.ledgerwallet.md).[decrypt](_ledger_wallet_.ledgerwallet.md#decrypt)*

Defined in wallet-base/lib/wallet-base.d.ts:60

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer›*

___

###  getAccounts

▸ **getAccounts**(): *Address[]*

*Inherited from [LedgerWallet](_ledger_wallet_.ledgerwallet.md).[getAccounts](_ledger_wallet_.ledgerwallet.md#getaccounts)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:27

Get a list of accounts in the remote wallet

**Returns:** *Address[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: Address): *boolean*

*Inherited from [LedgerWallet](_ledger_wallet_.ledgerwallet.md).[hasAccount](_ledger_wallet_.ledgerwallet.md#hasaccount)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:32

Returns true if account is in the remote wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | Address | Account to check  |

**Returns:** *boolean*

___

###  init

▸ **init**(): *Promise‹void›*

*Inherited from [LedgerWallet](_ledger_wallet_.ledgerwallet.md).[init](_ledger_wallet_.ledgerwallet.md#init)*

Defined in wallet-remote/lib/remote-wallet.d.ts:15

Discovers wallet accounts and caches results in memory
Idempotent to ensure multiple calls are benign

**Returns:** *Promise‹void›*

___

###  removeAccount

▸ **removeAccount**(`_address`: string): *void*

*Inherited from [LedgerWallet](_ledger_wallet_.ledgerwallet.md).[removeAccount](_ledger_wallet_.ledgerwallet.md#removeaccount)*

Defined in wallet-base/lib/wallet-base.d.ts:23

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

Name | Type |
------ | ------ |
`_address` | string |

**Returns:** *void*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: Address, `data`: string): *Promise‹string›*

*Inherited from [LedgerWallet](_ledger_wallet_.ledgerwallet.md).[signPersonalMessage](_ledger_wallet_.ledgerwallet.md#signpersonalmessage)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:43

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the account to sign with |
`data` | string | Hex string message to sign |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  signTransaction

▸ **signTransaction**(`txParams`: CeloTx): *Promise‹EncodedTransaction›*

*Overrides void*

*Defined in [wallet-ledger/src/ledger-wallet.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-wallet.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`txParams` | CeloTx |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: Address, `typedData`: EIP712TypedData): *Promise‹string›*

*Inherited from [LedgerWallet](_ledger_wallet_.ledgerwallet.md).[signTypedData](_ledger_wallet_.ledgerwallet.md#signtypeddata)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:49

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
