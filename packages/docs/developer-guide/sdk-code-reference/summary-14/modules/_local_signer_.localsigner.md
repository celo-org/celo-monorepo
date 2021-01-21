# LocalSigner

Signs the EVM transaction using the provided private key

## Hierarchy

* **LocalSigner**

## Implements

* Signer

## Index

### Constructors

* [constructor]()

### Methods

* [computeSharedSecret]()
* [decrypt]()
* [getNativeKey]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

## Constructors

### constructor

+ **new LocalSigner**\(`privateKey`: string\): [_LocalSigner_]()

_Defined in_ [_wallet-local/src/local-signer.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L15)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |

**Returns:** [_LocalSigner_]()

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`publicKey`: string\): _Promise‹Buffer›_

_Defined in_ [_wallet-local/src/local-signer.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L71)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `publicKey` | string |

**Returns:** _Promise‹Buffer›_

### decrypt

▸ **decrypt**\(`ciphertext`: Buffer\): _Promise‹Buffer‹››_

_Defined in_ [_wallet-local/src/local-signer.ts:63_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L63)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `ciphertext` | Buffer |

**Returns:** _Promise‹Buffer‹››_

### getNativeKey

▸ **getNativeKey**\(\): _string_

_Defined in_ [_wallet-local/src/local-signer.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L21)

**Returns:** _string_

### signPersonalMessage

▸ **signPersonalMessage**\(`data`: string\): _Promise‹object›_

_Defined in_ [_wallet-local/src/local-signer.ts:34_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L34)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** _Promise‹object›_

### signTransaction

▸ **signTransaction**\(`addToV`: number, `encodedTx`: RLPEncodedTx\): _Promise‹object›_

_Defined in_ [_wallet-local/src/local-signer.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L25)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | RLPEncodedTx |

**Returns:** _Promise‹object›_

### signTypedData

▸ **signTypedData**\(`typedData`: EIP712TypedData\): _Promise‹object›_

_Defined in_ [_wallet-local/src/local-signer.ts:50_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L50)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | EIP712TypedData |

**Returns:** _Promise‹object›_

