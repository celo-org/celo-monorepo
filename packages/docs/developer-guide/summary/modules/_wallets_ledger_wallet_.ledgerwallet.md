# LedgerWallet

## Hierarchy

↳ [RemoteWallet]()‹[LedgerSigner]()›

↳ **LedgerWallet**

## Implements

* [ReadOnlyWallet]()
* [ReadOnlyWallet]()
* [ReadOnlyWallet]()

## Index

### Constructors

* [constructor]()

### Properties

* [baseDerivationPath]()
* [derivationPathIndexes]()
* [ledgerAddressValidation]()
* [transport]()

### Methods

* [computeSharedSecret]()
* [decrypt]()
* [getAccounts]()
* [hasAccount]()
* [init]()
* [isSetupFinished]()
* [removeAccount]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

## Constructors

### constructor

+ **new LedgerWallet**\(`derivationPathIndexes`: number\[\], `baseDerivationPath`: string, `transport`: any, `ledgerAddressValidation`: [AddressValidation]()\): [_LedgerWallet_]()

_Defined in_ [_packages/contractkit/src/wallets/ledger-wallet.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L46)

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `derivationPathIndexes` | number\[\] | zeroRange\(ADDRESS\_QTY\) | number array of "address\_index" for the base derivation path. Default: Array\[0..9\]. Example: \[3, 99, 53\] will retrieve the derivation paths of \[`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`\] |
| `baseDerivationPath` | string | CELO\_BASE\_DERIVATION\_PATH | base derivation path. Default: "44'/52752'/0'/0" |
| `transport` | any | {} | Transport to connect the ledger device |
| `ledgerAddressValidation` | [AddressValidation]() | AddressValidation.firstTransactionPerAddress | - |

**Returns:** [_LedgerWallet_]()

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

• **ledgerAddressValidation**: [_AddressValidation_]()

_Defined in_ [_packages/contractkit/src/wallets/ledger-wallet.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L60)

### `Readonly` transport

• **transport**: _any_

_Defined in_ [_packages/contractkit/src/wallets/ledger-wallet.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L59)

Transport to connect the ledger device

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`address`: [Address](_base_.md#address), `publicKey`: string\): _Promise‹Buffer›_

_Inherited from_ [_WalletBase_]()_._[_computeSharedSecret_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L157)

Computes the shared secret \(an ECDH key exchange object\) between two accounts

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_base_.md#address) |
| `publicKey` | string |

**Returns:** _Promise‹Buffer›_

### decrypt

▸ **decrypt**\(`address`: string, `ciphertext`: Buffer\): _Promise‹Buffer‹››_

_Inherited from_ [_WalletBase_]()_._[_decrypt_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:149_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L149)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `ciphertext` | Buffer |

**Returns:** _Promise‹Buffer‹››_

### getAccounts

▸ **getAccounts**\(\): [_Address_](_base_.md#address)_\[\]_

_Inherited from_ [_RemoteWallet_]()_._[_getAccounts_]()

_Overrides_ [_WalletBase_]()_._[_getAccounts_]()

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L62)

Get a list of accounts in the remote wallet

**Returns:** [_Address_](_base_.md#address)_\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: [Address](_base_.md#address)\): _boolean_

_Inherited from_ [_RemoteWallet_]()_._[_hasAccount_]()

_Overrides_ [_WalletBase_]()_._[_hasAccount_]()

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L71)

Returns true if account is in the remote wallet

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | [Address](_base_.md#address) | Account to check |

**Returns:** _boolean_

### init

▸ **init**\(\): _Promise‹void›_

_Inherited from_ [_RemoteWallet_]()_._[_init_]()

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L21)

Discovers wallet accounts and caches results in memory Idempotent to ensure multiple calls are benign

**Returns:** _Promise‹void›_

### isSetupFinished

▸ **isSetupFinished**\(\): _boolean_

_Inherited from_ [_RemoteWallet_]()_._[_isSetupFinished_]()

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:111_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L111)

**Returns:** _boolean_

### removeAccount

▸ **removeAccount**\(`_address`: string\): _void_

_Inherited from_ [_WalletBase_]()_._[_removeAccount_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L52)

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_address` | string |

**Returns:** _void_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: [Address](_base_.md#address), `data`: string\): _Promise‹string›_

_Inherited from_ [_RemoteWallet_]()_._[_signPersonalMessage_]()

_Overrides_ [_WalletBase_]()_._[_signPersonalMessage_]()

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:90_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L90)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](_base_.md#address) | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: Tx\): _Promise‹EncodedTransaction›_

_Inherited from_ [_RemoteWallet_]()_._[_signTransaction_]()

_Overrides_ [_WalletBase_]()_._[_signTransaction_]()

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:80_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L80)

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | Tx | EVM transaction |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: [Address](_base_.md#address), `typedData`: EIP712TypedData\): _Promise‹string›_

_Inherited from_ [_RemoteWallet_]()_._[_signTypedData_]()

_Overrides_ [_WalletBase_]()_._[_signTypedData_]()

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:100_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L100)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](_base_.md#address) | Address of the account to sign with |
| `typedData` | EIP712TypedData | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

