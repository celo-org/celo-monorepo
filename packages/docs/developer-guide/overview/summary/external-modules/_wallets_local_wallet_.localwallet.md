# LocalWallet

## Hierarchy

* [WalletBase]()

  ↳ **LocalWallet**

## Implements

* [Wallet]()
* [Wallet]()

## Index

### Methods

* [addAccount]()
* [getAccounts]()
* [hasAccount]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

## Methods

### addAccount

▸ **addAccount**\(`privateKey`: string\): _void_

_Defined in_ [_contractkit/src/wallets/local-wallet.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/local-wallet.ts#L10)

Register the private key as signer account

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `privateKey` | string | account private key |

**Returns:** _void_

### getAccounts

▸ **getAccounts**\(\): [_Address_](_base_.md#address)_\[\]_

_Inherited from_ [_WalletBase_]()_._[_getAccounts_]()

_Defined in_ [_contractkit/src/wallets/wallet.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L29)

Gets a list of accounts that have been registered

**Returns:** [_Address_](_base_.md#address)_\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: [Address](_base_.md#address)\): _boolean_

_Inherited from_ [_WalletBase_]()_._[_hasAccount_]()

_Defined in_ [_contractkit/src/wallets/wallet.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L37)

Returns true if account has been registered

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | [Address](_base_.md#address) | Account to check |

**Returns:** _boolean_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: [Address](_base_.md#address), `data`: string\): _Promise‹string›_

_Inherited from_ [_WalletBase_]()_._[_signPersonalMessage_]()

_Defined in_ [_contractkit/src/wallets/wallet.ts:81_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L81)

Sign a personal Ethereum signed message.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](_base_.md#address) | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: Tx\): _Promise‹EncodedTransaction›_

_Inherited from_ [_WalletBase_]()_._[_signTransaction_]()

_Defined in_ [_contractkit/src/wallets/wallet.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L60)

Gets the signer based on the 'from' field in the tx body

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | Tx | Transaction to sign |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: [Address](_base_.md#address), `typedData`: [EIP712TypedData]()\): _Promise‹string›_

_Inherited from_ [_WalletBase_]()_._[_signTypedData_]()

_Defined in_ [_contractkit/src/wallets/wallet.ts:98_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L98)

Sign an EIP712 Typed Data message.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](_base_.md#address) | Address of the account to sign with |
| `typedData` | [EIP712TypedData]() | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

