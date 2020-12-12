# LocalWallet

## Hierarchy

* [WalletBase](_wallets_wallet_.walletbase.md)‹[LocalSigner](_wallets_signers_local_signer_.localsigner.md)›

  ↳ **LocalWallet**

## Implements

* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)
* [Wallet](../interfaces/_wallets_wallet_.wallet.md)

## Index

### Methods

* [addAccount](_wallets_local_wallet_.localwallet.md#addaccount)
* [computeSharedSecret](_wallets_local_wallet_.localwallet.md#computesharedsecret)
* [decrypt](_wallets_local_wallet_.localwallet.md#decrypt)
* [getAccounts](_wallets_local_wallet_.localwallet.md#getaccounts)
* [hasAccount](_wallets_local_wallet_.localwallet.md#hasaccount)
* [removeAccount](_wallets_local_wallet_.localwallet.md#removeaccount)
* [signPersonalMessage](_wallets_local_wallet_.localwallet.md#signpersonalmessage)
* [signTransaction](_wallets_local_wallet_.localwallet.md#signtransaction)
* [signTypedData](_wallets_local_wallet_.localwallet.md#signtypeddata)

## Methods

### addAccount

▸ **addAccount**\(`privateKey`: string\): _void_

_Defined in_ [_packages/contractkit/src/wallets/local-wallet.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/local-wallet.ts#L11)

Register the private key as signer account

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `privateKey` | string | account private key |

**Returns:** _void_

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

_Inherited from_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_getAccounts_](_wallets_wallet_.walletbase.md#getaccounts)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L44)

Gets a list of accounts that have been registered

**Returns:** [_Address_](../modules/_base_.md#address)_\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: [Address](../modules/_base_.md#address)\): _boolean_

_Inherited from_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_hasAccount_](_wallets_wallet_.walletbase.md#hasaccount)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L60)

Returns true if account has been registered

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | [Address](../modules/_base_.md#address) | Account to check |

**Returns:** _boolean_

### removeAccount

▸ **removeAccount**\(`address`: [Address](../modules/_base_.md#address)\): _void_

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_removeAccount_](_wallets_wallet_.walletbase.md#removeaccount)

_Defined in_ [_packages/contractkit/src/wallets/local-wallet.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/local-wallet.ts#L25)

Remove the account

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) | Adddress of the account to remove |

**Returns:** _void_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: [Address](../modules/_base_.md#address), `data`: string\): _Promise‹string›_

_Inherited from_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signPersonalMessage_](_wallets_wallet_.walletbase.md#signpersonalmessage)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:113_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L113)

Sign a personal Ethereum signed message.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: Tx\): _Promise‹EncodedTransaction›_

_Inherited from_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signTransaction_](_wallets_wallet_.walletbase.md#signtransaction)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:92_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L92)

Gets the signer based on the 'from' field in the tx body

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | Tx | Transaction to sign |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: [Address](../modules/_base_.md#address), `typedData`: EIP712TypedData\): _Promise‹string›_

_Inherited from_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signTypedData_](_wallets_wallet_.walletbase.md#signtypeddata)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:130_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L130)

Sign an EIP712 Typed Data message.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
| `typedData` | EIP712TypedData | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

