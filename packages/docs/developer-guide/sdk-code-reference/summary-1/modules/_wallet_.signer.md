# Signer

## Hierarchy

* **Signer**

## Index

### Properties

* [computeSharedSecret]()
* [decrypt]()
* [getNativeKey]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

## Properties

### computeSharedSecret

• **computeSharedSecret**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L29)

#### Type declaration:

▸ \(`publicKey`: string\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `publicKey` | string |

### decrypt

• **decrypt**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L28)

#### Type declaration:

▸ \(`ciphertext`: Buffer\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `ciphertext` | Buffer |

### getNativeKey

• **getNativeKey**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L27)

#### Type declaration:

▸ \(\): _string_

### signPersonalMessage

• **signPersonalMessage**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L25)

#### Type declaration:

▸ \(`data`: string\): _Promise‹object›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

### signTransaction

• **signTransaction**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L21)

Signs the message and returns an EVM transaction

**`param`** represents the chainId and is added to the recoveryId to prevent replay

**`param`** is the RLPEncoded transaction object

#### Type declaration:

▸ \(`addToV`: number, `encodedTx`: [RLPEncodedTx]()\): _Promise‹object›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | [RLPEncodedTx]() |

### signTypedData

• **signTypedData**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L26)

#### Type declaration:

▸ \(`typedData`: EIP712TypedData\): _Promise‹object›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | EIP712TypedData |

