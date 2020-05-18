# LedgerWallet

## Hierarchy

↳ [RemoteWallet]()

↳ **LedgerWallet**

## Implements

* [Wallet]()
* [Wallet]()
* [Wallet]()

## Index

### Constructors

* [constructor]()

### Properties

* [baseDerivationPath]()
* [derivationPathIndexes]()
* [ledgerAddressValidation]()
* [transport]()

### Methods

* [getAccounts]()
* [hasAccount]()
* [init]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

## Constructors

### constructor

+ **new LedgerWallet**\(`derivationPathIndexes`: number\[\], `baseDerivationPath`: string, `transport`: any, `ledgerAddressValidation`: [AddressValidation]()\): [_LedgerWallet_]()

_Defined in_ [_contractkit/src/wallets/ledger-wallet.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L46)

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `derivationPathIndexes` | number\[\] | Array.from\(Array\(ADDRESS\_QTY\).keys\(\)\) | number array of "address\_index" for the base derivation path. Default: Array\[0..9\]. Example: \[3, 99, 53\] will retrieve the derivation paths of \[`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`\] |
| `baseDerivationPath` | string | CELO\_BASE\_DERIVATION\_PATH | base derivation path. Default: "44'/52752'/0'/0" |
| `transport` | any | {} | Transport to connect the ledger device |
| `ledgerAddressValidation` | [AddressValidation]() | AddressValidation.firstTransactionPerAddress | - |

**Returns:** [_LedgerWallet_]()

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

• **ledgerAddressValidation**: [_AddressValidation_]()

_Defined in_ [_contractkit/src/wallets/ledger-wallet.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L60)

### transport

• **transport**: _any_

_Defined in_ [_contractkit/src/wallets/ledger-wallet.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L59)

Transport to connect the ledger device

## Methods

### getAccounts

▸ **getAccounts**\(\): [_Address_](_base_.md#address)_\[\]_

_Inherited from_ [_RemoteWallet_]()_._[_getAccounts_]()

_Overrides_ [_WalletBase_]()_._[_getAccounts_]()

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L61)

Get a list of accounts in the remote wallet

**Returns:** [_Address_](_base_.md#address)_\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: [Address](_base_.md#address)\): _boolean_

_Inherited from_ [_RemoteWallet_]()_._[_hasAccount_]()

_Overrides_ [_WalletBase_]()_._[_hasAccount_]()

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L70)

Returns true if account is in the remote wallet

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | [Address](_base_.md#address) | Account to check |

**Returns:** _boolean_

### init

▸ **init**\(\): _Promise‹void›_

_Inherited from_ [_RemoteWallet_]()_._[_init_]()

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L20)

Discovers wallet accounts and caches results in memory Idempotent to ensure multiple calls are benign

**Returns:** _Promise‹void›_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: [Address](_base_.md#address), `data`: string\): _Promise‹string›_

_Inherited from_ [_RemoteWallet_]()_._[_signPersonalMessage_]()

_Overrides_ [_WalletBase_]()_._[_signPersonalMessage_]()

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:89_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L89)

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

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:79_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L79)

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | Tx | EVM transaction |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: [Address](_base_.md#address), `typedData`: [EIP712TypedData]()\): _Promise‹string›_

_Inherited from_ [_RemoteWallet_]()_._[_signTypedData_]()

_Overrides_ [_WalletBase_]()_._[_signTypedData_]()

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L99)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](_base_.md#address) | Address of the account to sign with |
| `typedData` | [EIP712TypedData]() | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

