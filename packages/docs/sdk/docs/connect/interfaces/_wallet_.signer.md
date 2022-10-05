[@celo/connect](../README.md) › [Globals](../globals.md) › ["wallet"](../modules/_wallet_.md) › [Signer](_wallet_.signer.md)

# Interface: Signer

## Hierarchy

* **Signer**

## Index

### Properties

* [computeSharedSecret](_wallet_.signer.md#computesharedsecret)
* [decrypt](_wallet_.signer.md#decrypt)
* [getNativeKey](_wallet_.signer.md#getnativekey)
* [signPersonalMessage](_wallet_.signer.md#signpersonalmessage)
* [signTransaction](_wallet_.signer.md#signtransaction)
* [signTypedData](_wallet_.signer.md#signtypeddata)

## Properties

###  computeSharedSecret

• **computeSharedSecret**: *function*

*Defined in [wallet.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L29)*

#### Type declaration:

▸ (`publicKey`: string): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

___

###  decrypt

• **decrypt**: *function*

*Defined in [wallet.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L28)*

#### Type declaration:

▸ (`ciphertext`: Buffer): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`ciphertext` | Buffer |

___

###  getNativeKey

• **getNativeKey**: *function*

*Defined in [wallet.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L27)*

#### Type declaration:

▸ (): *string*

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Defined in [wallet.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L25)*

#### Type declaration:

▸ (`data`: string): *Promise‹object›*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

___

###  signTransaction

• **signTransaction**: *function*

*Defined in [wallet.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L21)*

Signs the message and returns an EVM transaction

**`param`** represents the chainId and is added to the recoveryId to prevent replay

**`param`** is the RLPEncoded transaction object

#### Type declaration:

▸ (`addToV`: number, `encodedTx`: [RLPEncodedTx](_types_.rlpencodedtx.md)): *Promise‹object›*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | [RLPEncodedTx](_types_.rlpencodedtx.md) |

___

###  signTypedData

• **signTypedData**: *function*

*Defined in [wallet.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L26)*

#### Type declaration:

▸ (`typedData`: EIP712TypedData): *Promise‹object›*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | EIP712TypedData |
