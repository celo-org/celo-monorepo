# Class: LocalSigner

Signs the EVM transaction using the provided private key

## Hierarchy

* **LocalSigner**

## Implements

* [Signer](../interfaces/_wallets_signers_signer_.signer.md)

## Index

### Constructors

* [constructor](_wallets_signers_local_signer_.localsigner.md#constructor)

### Methods

* [computeSharedSecret](_wallets_signers_local_signer_.localsigner.md#computesharedsecret)
* [decrypt](_wallets_signers_local_signer_.localsigner.md#decrypt)
* [getNativeKey](_wallets_signers_local_signer_.localsigner.md#getnativekey)
* [signPersonalMessage](_wallets_signers_local_signer_.localsigner.md#signpersonalmessage)
* [signTransaction](_wallets_signers_local_signer_.localsigner.md#signtransaction)
* [signTypedData](_wallets_signers_local_signer_.localsigner.md#signtypeddata)

## Constructors

###  constructor

\+ **new LocalSigner**(`privateKey`: string): *[LocalSigner](_wallets_signers_local_signer_.localsigner.md)*

*Defined in [packages/contractkit/src/wallets/signers/local-signer.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *[LocalSigner](_wallets_signers_local_signer_.localsigner.md)*

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`publicKey`: string): *Promise‹Buffer›*

*Defined in [packages/contractkit/src/wallets/signers/local-signer.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L71)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *Promise‹Buffer›*

___

###  decrypt

▸ **decrypt**(`ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [packages/contractkit/src/wallets/signers/local-signer.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [packages/contractkit/src/wallets/signers/local-signer.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L21)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [packages/contractkit/src/wallets/signers/local-signer.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)): *Promise‹object›*

*Defined in [packages/contractkit/src/wallets/signers/local-signer.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** *Promise‹object›*

___

###  signTypedData

▸ **signTypedData**(`typedData`: EIP712TypedData): *Promise‹object›*

*Defined in [packages/contractkit/src/wallets/signers/local-signer.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹object›*
