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

* [getNativeKey](_wallets_signers_local_signer_.localsigner.md#getnativekey)
* [signPersonalMessage](_wallets_signers_local_signer_.localsigner.md#signpersonalmessage)
* [signTransaction](_wallets_signers_local_signer_.localsigner.md#signtransaction)

## Constructors

###  constructor

\+ **new LocalSigner**(`privateKey`: string): *[LocalSigner](_wallets_signers_local_signer_.localsigner.md)*

*Defined in [contractkit/src/wallets/signers/local-signer.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *[LocalSigner](_wallets_signers_local_signer_.localsigner.md)*

## Methods

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [contractkit/src/wallets/signers/local-signer.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L18)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/local-signer.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/local-signer.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** *Promise‹object›*
