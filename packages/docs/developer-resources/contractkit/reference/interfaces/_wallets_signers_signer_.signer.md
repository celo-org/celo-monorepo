# Interface: Signer

## Hierarchy

* **Signer**

## Implemented by

* [AwsHsmSigner](../classes/_wallets_signers_aws_hsm_signer_.awshsmsigner.md)
* [AzureHSMSigner](../classes/_wallets_signers_azure_hsm_signer_.azurehsmsigner.md)
* [LedgerSigner](../classes/_wallets_signers_ledger_signer_.ledgersigner.md)
* [LocalSigner](../classes/_wallets_signers_local_signer_.localsigner.md)
* [RpcSigner](../classes/_wallets_signers_rpc_signer_.rpcsigner.md)

## Index

### Properties

* [computeSharedSecret](_wallets_signers_signer_.signer.md#computesharedsecret)
* [decrypt](_wallets_signers_signer_.signer.md#decrypt)
* [getNativeKey](_wallets_signers_signer_.signer.md#getnativekey)
* [signPersonalMessage](_wallets_signers_signer_.signer.md#signpersonalmessage)
* [signTransaction](_wallets_signers_signer_.signer.md#signtransaction)
* [signTypedData](_wallets_signers_signer_.signer.md#signtypeddata)

## Properties

###  computeSharedSecret

• **computeSharedSecret**: *function*

*Defined in [packages/contractkit/src/wallets/signers/signer.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L18)*

#### Type declaration:

▸ (`publicKey`: string): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

___

###  decrypt

• **decrypt**: *function*

*Defined in [packages/contractkit/src/wallets/signers/signer.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L17)*

#### Type declaration:

▸ (`ciphertext`: Buffer): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`ciphertext` | Buffer |

___

###  getNativeKey

• **getNativeKey**: *function*

*Defined in [packages/contractkit/src/wallets/signers/signer.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L16)*

#### Type declaration:

▸ (): *string*

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Defined in [packages/contractkit/src/wallets/signers/signer.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L14)*

#### Type declaration:

▸ (`data`: string): *Promise‹object›*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

___

###  signTransaction

• **signTransaction**: *function*

*Defined in [packages/contractkit/src/wallets/signers/signer.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L10)*

Signs the message and returns an EVM transaction

**`param`** represents the chainId and is added to the recoveryId to prevent replay

**`param`** is the RLPEncoded transaction object

#### Type declaration:

▸ (`addToV`: number, `encodedTx`: [RLPEncodedTx](_utils_signing_utils_.rlpencodedtx.md)): *Promise‹object›*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | [RLPEncodedTx](_utils_signing_utils_.rlpencodedtx.md) |

___

###  signTypedData

• **signTypedData**: *function*

*Defined in [packages/contractkit/src/wallets/signers/signer.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L15)*

#### Type declaration:

▸ (`typedData`: EIP712TypedData): *Promise‹object›*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | EIP712TypedData |
