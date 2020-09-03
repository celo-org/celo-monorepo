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

* [decrypt](_wallets_signers_local_signer_.localsigner.md#decrypt)
* [getNativeKey](_wallets_signers_local_signer_.localsigner.md#getnativekey)
* [signPersonalMessage](_wallets_signers_local_signer_.localsigner.md#signpersonalmessage)
* [signTransaction](_wallets_signers_local_signer_.localsigner.md#signtransaction)

## Constructors

###  constructor

\+ **new LocalSigner**(`privateKey`: string): *[LocalSigner](_wallets_signers_local_signer_.localsigner.md)*

*Defined in [packages/contractkit/src/wallets/signers/local-signer.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *[LocalSigner](_wallets_signers_local_signer_.localsigner.md)*

## Methods

###  decrypt

▸ **decrypt**(`ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [packages/contractkit/src/wallets/signers/local-signer.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [packages/contractkit/src/wallets/signers/local-signer.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L19)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [packages/contractkit/src/wallets/signers/local-signer.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)): *Promise‹object›*

*Defined in [packages/contractkit/src/wallets/signers/local-signer.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** *Promise‹object›*
