# RpcWallet

## Hierarchy

↳ [RemoteWallet](_wallets_remote_wallet_.remotewallet.md)‹[RpcSigner](_wallets_signers_rpc_signer_.rpcsigner.md)›

↳ **RpcWallet**

## Implements

* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)
* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)
* [UnlockableWallet](../interfaces/_wallets_wallet_.unlockablewallet.md)

## Index

### Constructors

* [constructor](_wallets_rpc_wallet_.rpcwallet.md#constructor)

### Methods

* [addAccount](_wallets_rpc_wallet_.rpcwallet.md#addaccount)
* [computeSharedSecret](_wallets_rpc_wallet_.rpcwallet.md#computesharedsecret)
* [decrypt](_wallets_rpc_wallet_.rpcwallet.md#decrypt)
* [getAccounts](_wallets_rpc_wallet_.rpcwallet.md#getaccounts)
* [hasAccount](_wallets_rpc_wallet_.rpcwallet.md#hasaccount)
* [init](_wallets_rpc_wallet_.rpcwallet.md#init)
* [isAccountUnlocked](_wallets_rpc_wallet_.rpcwallet.md#isaccountunlocked)
* [isSetupFinished](_wallets_rpc_wallet_.rpcwallet.md#issetupfinished)
* [loadAccountSigners](_wallets_rpc_wallet_.rpcwallet.md#loadaccountsigners)
* [removeAccount](_wallets_rpc_wallet_.rpcwallet.md#removeaccount)
* [signPersonalMessage](_wallets_rpc_wallet_.rpcwallet.md#signpersonalmessage)
* [signTransaction](_wallets_rpc_wallet_.rpcwallet.md#signtransaction)
* [signTypedData](_wallets_rpc_wallet_.rpcwallet.md#signtypeddata)
* [unlockAccount](_wallets_rpc_wallet_.rpcwallet.md#unlockaccount)

## Constructors

### constructor

+ **new RpcWallet**\(`_provider`: provider\): [_RpcWallet_](_wallets_rpc_wallet_.rpcwallet.md)

_Defined in_ [_packages/contractkit/src/wallets/rpc-wallet.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_provider` | provider |

**Returns:** [_RpcWallet_](_wallets_rpc_wallet_.rpcwallet.md)

## Methods

### addAccount

▸ **addAccount**\(`privateKey`: string, `passphrase`: string\): _Promise‹string›_

_Defined in_ [_packages/contractkit/src/wallets/rpc-wallet.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L39)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |
| `passphrase` | string |

**Returns:** _Promise‹string›_

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

### isAccountUnlocked

▸ **isAccountUnlocked**\(`address`: string\): _boolean_

_Defined in_ [_packages/contractkit/src/wallets/rpc-wallet.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L55)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _boolean_

### isSetupFinished

▸ **isSetupFinished**\(\): _boolean_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_isSetupFinished_](_wallets_remote_wallet_.remotewallet.md#issetupfinished)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:111_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L111)

**Returns:** _boolean_

### loadAccountSigners

▸ **loadAccountSigners**\(\): _Promise‹Map‹string,_ [_RpcSigner_](_wallets_signers_rpc_signer_.rpcsigner.md)_››_

_Overrides void_

_Defined in_ [_packages/contractkit/src/wallets/rpc-wallet.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L26)

**Returns:** _Promise‹Map‹string,_ [_RpcSigner_](_wallets_signers_rpc_signer_.rpcsigner.md)_››_

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

_Overrides_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_signTransaction_](_wallets_remote_wallet_.remotewallet.md#signtransaction)

_Defined in_ [_packages/contractkit/src/wallets/rpc-wallet.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L65)

Gets the signer based on the 'from' field in the tx body

**`dev`** overrides WalletBase.signTransaction

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | Tx | Transaction to sign |

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

### unlockAccount

▸ **unlockAccount**\(`address`: string, `passphrase`: string, `duration`: number\): _Promise‹boolean›_

_Defined in_ [_packages/contractkit/src/wallets/rpc-wallet.ts:50_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L50)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `passphrase` | string |
| `duration` | number |

**Returns:** _Promise‹boolean›_

