# Wallet

## Hierarchy

* ReadOnlyWallet

  ↳ **Wallet**

  ↳ [UnlockableWallet]()

## Index

### Properties

* [addAccount]()
* [computeSharedSecret]()
* [decrypt]()
* [getAccounts]()
* [hasAccount]()
* [removeAccount]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

## Properties

### addAccount

• **addAccount**: _addInMemoryAccount \| addRemoteAccount_

_Defined in_ [_wallets/wallet-base/src/wallet-base.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/wallet-base.ts#L11)

### computeSharedSecret

• **computeSharedSecret**: _function_

_Inherited from_ [_Wallet_]()_._[_computeSharedSecret_]()

Defined in connect/lib/wallet.d.ts:12

#### Type declaration:

▸ \(`address`: Address, `publicKey`: string\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |
| `publicKey` | string |

### decrypt

• **decrypt**: _function_

_Inherited from_ [_Wallet_]()_._[_decrypt_]()

Defined in connect/lib/wallet.d.ts:11

#### Type declaration:

▸ \(`address`: Address, `ciphertext`: Buffer\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |
| `ciphertext` | Buffer |

### getAccounts

• **getAccounts**: _function_

_Inherited from_ [_Wallet_]()_._[_getAccounts_]()

Defined in connect/lib/wallet.d.ts:5

#### Type declaration:

▸ \(\): _Address\[\]_

### hasAccount

• **hasAccount**: _function_

_Inherited from_ [_Wallet_]()_._[_hasAccount_]()

Defined in connect/lib/wallet.d.ts:7

#### Type declaration:

▸ \(`address?`: Address\): _boolean_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | Address |

### removeAccount

• **removeAccount**: _function_

_Inherited from_ [_Wallet_]()_._[_removeAccount_]()

Defined in connect/lib/wallet.d.ts:6

#### Type declaration:

▸ \(`address`: Address\): _void_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |

### signPersonalMessage

• **signPersonalMessage**: _function_

_Inherited from_ [_Wallet_]()_._[_signPersonalMessage_]()

Defined in connect/lib/wallet.d.ts:10

#### Type declaration:

▸ \(`address`: Address, `data`: string\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |
| `data` | string |

### signTransaction

• **signTransaction**: _function_

_Inherited from_ [_Wallet_]()_._[_signTransaction_]()

Defined in connect/lib/wallet.d.ts:8

#### Type declaration:

▸ \(`txParams`: CeloTx\): _Promise‹EncodedTransaction›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txParams` | CeloTx |

### signTypedData

• **signTypedData**: _function_

_Inherited from_ [_Wallet_]()_._[_signTypedData_]()

Defined in connect/lib/wallet.d.ts:9

#### Type declaration:

▸ \(`address`: Address, `typedData`: EIP712TypedData\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |
| `typedData` | EIP712TypedData |

