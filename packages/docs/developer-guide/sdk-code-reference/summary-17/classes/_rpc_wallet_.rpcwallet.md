# RpcWallet

## Hierarchy

* RemoteWallet‹[RpcSigner](_rpc_signer_.rpcsigner.md)›

  ↳ **RpcWallet**

## Implements

* ReadOnlyWallet
* ReadOnlyWallet
* UnlockableWallet

## Index

### Constructors

* [constructor](_rpc_wallet_.rpcwallet.md#constructor)

### Properties

* [isSetupFinished](_rpc_wallet_.rpcwallet.md#issetupfinished)

### Methods

* [addAccount](_rpc_wallet_.rpcwallet.md#addaccount)
* [computeSharedSecret](_rpc_wallet_.rpcwallet.md#computesharedsecret)
* [decrypt](_rpc_wallet_.rpcwallet.md#decrypt)
* [getAccounts](_rpc_wallet_.rpcwallet.md#getaccounts)
* [hasAccount](_rpc_wallet_.rpcwallet.md#hasaccount)
* [init](_rpc_wallet_.rpcwallet.md#init)
* [isAccountUnlocked](_rpc_wallet_.rpcwallet.md#isaccountunlocked)
* [loadAccountSigners](_rpc_wallet_.rpcwallet.md#loadaccountsigners)
* [removeAccount](_rpc_wallet_.rpcwallet.md#removeaccount)
* [signPersonalMessage](_rpc_wallet_.rpcwallet.md#signpersonalmessage)
* [signTransaction](_rpc_wallet_.rpcwallet.md#signtransaction)
* [signTypedData](_rpc_wallet_.rpcwallet.md#signtypeddata)
* [unlockAccount](_rpc_wallet_.rpcwallet.md#unlockaccount)

## Constructors

### constructor

+ **new RpcWallet**\(`_provider`: Provider\): [_RpcWallet_](_rpc_wallet_.rpcwallet.md)

_Defined in_ [_wallet-rpc/src/rpc-wallet.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-wallet.ts#L18)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_provider` | Provider |

**Returns:** [_RpcWallet_](_rpc_wallet_.rpcwallet.md)

## Properties

### isSetupFinished

• **isSetupFinished**: _function_

_Inherited from_ [_RpcWallet_](_rpc_wallet_.rpcwallet.md)_._[_isSetupFinished_](_rpc_wallet_.rpcwallet.md#issetupfinished)

Defined in wallet-remote/lib/remote-wallet.d.ts:51

#### Type declaration:

▸ \(\): _boolean_

## Methods

### addAccount

▸ **addAccount**\(`privateKey`: string, `passphrase`: string\): _Promise‹string›_

_Defined in_ [_wallet-rpc/src/rpc-wallet.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-wallet.ts#L38)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |
| `passphrase` | string |

**Returns:** _Promise‹string›_

### computeSharedSecret

▸ **computeSharedSecret**\(`address`: Address, `publicKey`: string\): _Promise‹Buffer›_

_Inherited from_ [_RpcWallet_](_rpc_wallet_.rpcwallet.md)_._[_computeSharedSecret_](_rpc_wallet_.rpcwallet.md#computesharedsecret)

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

_Inherited from_ [_RpcWallet_](_rpc_wallet_.rpcwallet.md)_._[_decrypt_](_rpc_wallet_.rpcwallet.md#decrypt)

Defined in wallet-base/lib/wallet-base.d.ts:60

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `ciphertext` | Buffer |

**Returns:** _Promise‹Buffer›_

### getAccounts

▸ **getAccounts**\(\): _Address\[\]_

_Inherited from_ [_RpcWallet_](_rpc_wallet_.rpcwallet.md)_._[_getAccounts_](_rpc_wallet_.rpcwallet.md#getaccounts)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:27

Get a list of accounts in the remote wallet

**Returns:** _Address\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: Address\): _boolean_

_Inherited from_ [_RpcWallet_](_rpc_wallet_.rpcwallet.md)_._[_hasAccount_](_rpc_wallet_.rpcwallet.md#hasaccount)

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

_Inherited from_ [_RpcWallet_](_rpc_wallet_.rpcwallet.md)_._[_init_](_rpc_wallet_.rpcwallet.md#init)

Defined in wallet-remote/lib/remote-wallet.d.ts:15

Discovers wallet accounts and caches results in memory Idempotent to ensure multiple calls are benign

**Returns:** _Promise‹void›_

### isAccountUnlocked

▸ **isAccountUnlocked**\(`address`: string\): _boolean_

_Defined in_ [_wallet-rpc/src/rpc-wallet.ts:54_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-wallet.ts#L54)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _boolean_

### loadAccountSigners

▸ **loadAccountSigners**\(\): _Promise‹Map‹string,_ [_RpcSigner_](_rpc_signer_.rpcsigner.md)_››_

_Overrides void_

_Defined in_ [_wallet-rpc/src/rpc-wallet.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-wallet.ts#L25)

**Returns:** _Promise‹Map‹string,_ [_RpcSigner_](_rpc_signer_.rpcsigner.md)_››_

### removeAccount

▸ **removeAccount**\(`_address`: string\): _void_

_Inherited from_ [_RpcWallet_](_rpc_wallet_.rpcwallet.md)_._[_removeAccount_](_rpc_wallet_.rpcwallet.md#removeaccount)

Defined in wallet-base/lib/wallet-base.d.ts:23

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_address` | string |

**Returns:** _void_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: Address, `data`: string\): _Promise‹string›_

_Inherited from_ [_RpcWallet_](_rpc_wallet_.rpcwallet.md)_._[_signPersonalMessage_](_rpc_wallet_.rpcwallet.md#signpersonalmessage)

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

_Overrides void_

_Defined in_ [_wallet-rpc/src/rpc-wallet.ts:64_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-wallet.ts#L64)

Gets the signer based on the 'from' field in the tx body

**`dev`** overrides WalletBase.signTransaction

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | CeloTx | Transaction to sign |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: Address, `typedData`: EIP712TypedData\): _Promise‹string›_

_Inherited from_ [_RpcWallet_](_rpc_wallet_.rpcwallet.md)_._[_signTypedData_](_rpc_wallet_.rpcwallet.md#signtypeddata)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:49

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Address of the account to sign with |
| `typedData` | EIP712TypedData | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### unlockAccount

▸ **unlockAccount**\(`address`: string, `passphrase`: string, `duration`: number\): _Promise‹boolean›_

_Defined in_ [_wallet-rpc/src/rpc-wallet.ts:49_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-wallet.ts#L49)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `passphrase` | string |
| `duration` | number |

**Returns:** _Promise‹boolean›_

