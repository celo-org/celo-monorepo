# Interface: Signer

## Hierarchy

* **Signer**

## Implemented by

* [AzureHSMSigner](../classes/_wallets_signers_azure_hsm_signer_.azurehsmsigner.md)
* [LedgerSigner](../classes/_wallets_signers_ledger_signer_.ledgersigner.md)
* [LocalSigner](../classes/_wallets_signers_local_signer_.localsigner.md)

## Index

### Properties

* [getNativeKey](_wallets_signers_signer_.signer.md#getnativekey)
* [signPersonalMessage](_wallets_signers_signer_.signer.md#signpersonalmessage)
* [signTransaction](_wallets_signers_signer_.signer.md#signtransaction)

## Properties

###  getNativeKey

• **getNativeKey**: *function*

*Defined in [contractkit/src/wallets/signers/signer.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L14)*

#### Type declaration:

▸ (): *string*

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Defined in [contractkit/src/wallets/signers/signer.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L13)*

#### Type declaration:

▸ (`data`: string): *Promise‹object›*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

___

###  signTransaction

• **signTransaction**: *function*

*Defined in [contractkit/src/wallets/signers/signer.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L9)*

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
