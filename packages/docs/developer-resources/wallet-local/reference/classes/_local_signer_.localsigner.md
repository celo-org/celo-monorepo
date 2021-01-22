# Class: LocalSigner

Signs the EVM transaction using the provided private key

## Hierarchy

* **LocalSigner**

## Implements

* Signer

## Index

### Constructors

* [constructor](_local_signer_.localsigner.md#constructor)

### Methods

* [computeSharedSecret](_local_signer_.localsigner.md#computesharedsecret)
* [decrypt](_local_signer_.localsigner.md#decrypt)
* [getNativeKey](_local_signer_.localsigner.md#getnativekey)
* [signPersonalMessage](_local_signer_.localsigner.md#signpersonalmessage)
* [signTransaction](_local_signer_.localsigner.md#signtransaction)
* [signTypedData](_local_signer_.localsigner.md#signtypeddata)

## Constructors

###  constructor

\+ **new LocalSigner**(`privateKey`: string): *[LocalSigner](_local_signer_.localsigner.md)*

*Defined in [wallet-local/src/local-signer.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *[LocalSigner](_local_signer_.localsigner.md)*

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`publicKey`: string): *Promise‹Buffer›*

*Defined in [wallet-local/src/local-signer.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L71)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *Promise‹Buffer›*

___

###  decrypt

▸ **decrypt**(`ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [wallet-local/src/local-signer.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [wallet-local/src/local-signer.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L21)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [wallet-local/src/local-signer.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: RLPEncodedTx): *Promise‹object›*

*Defined in [wallet-local/src/local-signer.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | RLPEncodedTx |

**Returns:** *Promise‹object›*

___

###  signTypedData

▸ **signTypedData**(`typedData`: EIP712TypedData): *Promise‹object›*

*Defined in [wallet-local/src/local-signer.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-signer.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹object›*
