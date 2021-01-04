# Wallet

## Hierarchy

* [ReadOnlyWallet]()

  ↳ **Wallet**

  ↳ [UnlockableWallet]()

## Implemented by

* [LocalWallet]()

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

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L28)

### computeSharedSecret

• **computeSharedSecret**: _function_

_Inherited from_ [_ReadOnlyWallet_]()_._[_computeSharedSecret_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L21)

#### Type declaration:

▸ \(`address`: [Address](), `publicKey`: string\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address]() |
| `publicKey` | string |

### decrypt

• **decrypt**: _function_

_Inherited from_ [_ReadOnlyWallet_]()_._[_decrypt_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L20)

#### Type declaration:

▸ \(`address`: [Address](), `ciphertext`: Buffer\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address]() |
| `ciphertext` | Buffer |

### getAccounts

• **getAccounts**: _function_

_Inherited from_ [_ReadOnlyWallet_]()_._[_getAccounts_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L14)

#### Type declaration:

▸ \(\): [_Address_]()_\[\]_

### hasAccount

• **hasAccount**: _function_

_Inherited from_ [_ReadOnlyWallet_]()_._[_hasAccount_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L16)

#### Type declaration:

▸ \(`address?`: [Address]()\): _boolean_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | [Address]() |

### removeAccount

• **removeAccount**: _function_

_Inherited from_ [_ReadOnlyWallet_]()_._[_removeAccount_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L15)

#### Type declaration:

▸ \(`address`: [Address]()\): _void_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address]() |

### signPersonalMessage

• **signPersonalMessage**: _function_

_Inherited from_ [_ReadOnlyWallet_]()_._[_signPersonalMessage_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L19)

#### Type declaration:

▸ \(`address`: [Address](), `data`: string\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address]() |
| `data` | string |

### signTransaction

• **signTransaction**: _function_

_Inherited from_ [_ReadOnlyWallet_]()_._[_signTransaction_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L17)

#### Type declaration:

▸ \(`txParams`: Tx\): _Promise‹EncodedTransaction›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txParams` | Tx |

### signTypedData

• **signTypedData**: _function_

_Inherited from_ [_ReadOnlyWallet_]()_._[_signTypedData_]()

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L18)

#### Type declaration:

▸ \(`address`: [Address](), `typedData`: EIP712TypedData\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address]() |
| `typedData` | EIP712TypedData |

