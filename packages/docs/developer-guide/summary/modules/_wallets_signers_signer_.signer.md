# Signer

## Hierarchy

* **Signer**

## Implemented by

* [AwsHsmSigner]()
* [AzureHSMSigner]()
* [LedgerSigner]()
* [LocalSigner]()
* [RpcSigner]()

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

_Defined in_ [_packages/contractkit/src/wallets/signers/signer.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L18)

#### Type declaration:

▸ \(`publicKey`: string\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `publicKey` | string |

### decrypt

• **decrypt**: _function_

_Defined in_ [_packages/contractkit/src/wallets/signers/signer.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L17)

#### Type declaration:

▸ \(`ciphertext`: Buffer\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `ciphertext` | Buffer |

### getNativeKey

• **getNativeKey**: _function_

_Defined in_ [_packages/contractkit/src/wallets/signers/signer.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L16)

#### Type declaration:

▸ \(\): _string_

### signPersonalMessage

• **signPersonalMessage**: _function_

_Defined in_ [_packages/contractkit/src/wallets/signers/signer.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L14)

#### Type declaration:

▸ \(`data`: string\): _Promise‹object›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

### signTransaction

• **signTransaction**: _function_

_Defined in_ [_packages/contractkit/src/wallets/signers/signer.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L10)

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

_Defined in_ [_packages/contractkit/src/wallets/signers/signer.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L15)

#### Type declaration:

▸ \(`typedData`: EIP712TypedData\): _Promise‹object›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | EIP712TypedData |

