# RemoteWallet

Abstract class representing a remote wallet that requires async initialization

## Hierarchy

* [WalletBase]()

  ↳ **RemoteWallet**

  ↳ [AzureHSMWallet]()

  ↳ [LedgerWallet]()

## Implements

* [Wallet]()
* [Wallet]()

## Index

### Methods

* [getAccounts]()
* [hasAccount]()
* [init]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

## Methods

### getAccounts

▸ **getAccounts**\(\): [_Address_](_base_.md#address)_\[\]_

_Overrides_ [_WalletBase_]()_._[_getAccounts_]()

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L61)

Get a list of accounts in the remote wallet

**Returns:** [_Address_](_base_.md#address)_\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: [Address](_base_.md#address)\): _boolean_

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

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L20)

Discovers wallet accounts and caches results in memory Idempotent to ensure multiple calls are benign

**Returns:** _Promise‹void›_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: [Address](_base_.md#address), `data`: string\): _Promise‹string›_

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

_Overrides_ [_WalletBase_]()_._[_signTypedData_]()

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L99)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](_base_.md#address) | Address of the account to sign with |
| `typedData` | [EIP712TypedData]() | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

