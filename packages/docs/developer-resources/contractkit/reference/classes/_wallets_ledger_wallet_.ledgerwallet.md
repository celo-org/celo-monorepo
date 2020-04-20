# Class: LedgerWallet

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

###  constructor

\+ **new LedgerWallet**(`derivationPathIndexes`: number[], `baseDerivationPath`: string, `transport`: any, `ledgerAddressValidation`: [AddressValidation](../enums/_wallets_ledger_wallet_.addressvalidation.md)): *[LedgerWallet](_wallets_ledger_wallet_.ledgerwallet.md)*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L46)*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`derivationPathIndexes` | number[] | Array.from(Array(ADDRESS_QTY).keys()) | number array of "address_index" for the base derivation path. Default: Array[0..9]. Example: [3, 99, 53] will retrieve the derivation paths of [`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`] |
`baseDerivationPath` | string | CELO_BASE_DERIVATION_PATH | base derivation path. Default: "44'/52752'/0'/0" |
`transport` | any | {} | Transport to connect the ledger device  |
`ledgerAddressValidation` | [AddressValidation](../enums/_wallets_ledger_wallet_.addressvalidation.md) | AddressValidation.firstTransactionPerAddress | - |

**Returns:** *[LedgerWallet](_wallets_ledger_wallet_.ledgerwallet.md)*

## Properties

###  baseDerivationPath

• **baseDerivationPath**: *string*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L58)*

base derivation path. Default: "44'/52752'/0'/0"

___

###  derivationPathIndexes

• **derivationPathIndexes**: *number[]*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L57)*

number array of "address_index" for the base derivation path.
Default: Array[0..9].
Example: [3, 99, 53] will retrieve the derivation paths of
[`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`]

___

###  ledgerAddressValidation

• **ledgerAddressValidation**: *[AddressValidation](../enums/_wallets_ledger_wallet_.addressvalidation.md)*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L60)*

___

###  transport

• **transport**: *any*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L59)*

Transport to connect the ledger device

## Methods

###  getAccounts

▸ **getAccounts**(): *[Address](../modules/_base_.md#address)[]*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[getAccounts](_wallets_remote_wallet_.remotewallet.md#getaccounts)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[getAccounts](_wallets_wallet_.walletbase.md#getaccounts)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L61)*

Get a list of accounts in the remote wallet

**Returns:** *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: [Address](../modules/_base_.md#address)): *boolean*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[hasAccount](_wallets_remote_wallet_.remotewallet.md#hasaccount)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[hasAccount](_wallets_wallet_.walletbase.md#hasaccount)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L70)*

Returns true if account is in the remote wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | [Address](../modules/_base_.md#address) | Account to check  |

**Returns:** *boolean*

___

###  init

▸ **init**(): *Promise‹void›*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[init](_wallets_remote_wallet_.remotewallet.md#init)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L20)*

Discovers wallet accounts and caches results in memory
Idempotent to ensure multiple calls are benign

**Returns:** *Promise‹void›*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: [Address](../modules/_base_.md#address), `data`: string): *Promise‹string›*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[signPersonalMessage](_wallets_remote_wallet_.remotewallet.md#signpersonalmessage)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[signPersonalMessage](_wallets_wallet_.walletbase.md#signpersonalmessage)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L89)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
`data` | string | Hex string message to sign |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  signTransaction

▸ **signTransaction**(`txParams`: Tx): *Promise‹EncodedTransaction›*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[signTransaction](_wallets_remote_wallet_.remotewallet.md#signtransaction)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[signTransaction](_wallets_wallet_.walletbase.md#signtransaction)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L79)*

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | Tx | EVM transaction  |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: [Address](../modules/_base_.md#address), `typedData`: [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹string›*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[signTypedData](_wallets_remote_wallet_.remotewallet.md#signtypeddata)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[signTypedData](_wallets_wallet_.walletbase.md#signtypeddata)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L99)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
`typedData` | [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md) | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
