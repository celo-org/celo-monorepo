# LocalWallet

## Hierarchy

* [WalletBase]()‹[LocalSigner]()›

  ↳ **LocalWallet**

## Implements

* [ReadOnlyWallet]()
* [Wallet]()

## Index

### Methods

* [addAccount]()
* [computeSharedSecret]()
* [decrypt]()
* [getAccounts]()
* [hasAccount]()
* [removeAccount]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

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

▸ **computeSharedSecret**\(`address`: [Address](), `publicKey`: string\): _Promise‹Buffer›_

_Inherited from_ [_WalletBase_]()_._[_computeSharedSecret_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L157)

Computes the shared secret \(an ECDH key exchange object\) between two accounts

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address]() |
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

▸ **getAccounts**\(\): [_Address_]()_\[\]_

_Inherited from_ [_WalletBase_]()_._[_getAccounts_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L44)

Gets a list of accounts that have been registered

**Returns:** [_Address_]()_\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: [Address]()\): _boolean_

_Inherited from_ [_WalletBase_]()_._[_hasAccount_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L60)

Returns true if account has been registered

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | [Address]() | Account to check |

**Returns:** _boolean_

### removeAccount

▸ **removeAccount**\(`address`: [Address]()\): _void_

_Overrides_ [_WalletBase_]()_._[_removeAccount_]()

_Defined in_ [_packages/contractkit/src/wallets/local-wallet.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/local-wallet.ts#L25)

Remove the account

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address]() | Adddress of the account to remove |

**Returns:** _void_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: [Address](), `data`: string\): _Promise‹string›_

_Inherited from_ [_WalletBase_]()_._[_signPersonalMessage_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:113_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L113)

Sign a personal Ethereum signed message.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address]() | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: Tx\): _Promise‹EncodedTransaction›_

_Inherited from_ [_WalletBase_]()_._[_signTransaction_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:92_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L92)

Gets the signer based on the 'from' field in the tx body

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | Tx | Transaction to sign |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: [Address](), `typedData`: EIP712TypedData\): _Promise‹string›_

_Inherited from_ [_WalletBase_]()_._[_signTypedData_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:130_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L130)

Sign an EIP712 Typed Data message.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address]() | Address of the account to sign with |
| `typedData` | EIP712TypedData | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

