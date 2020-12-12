# Signer

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

▸ \(`addToV`: number, `encodedTx`: [RLPEncodedTx](_utils_signing_utils_.rlpencodedtx.md)\): _Promise‹object›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | [RLPEncodedTx](_utils_signing_utils_.rlpencodedtx.md) |

### signTypedData

• **signTypedData**: _function_

_Defined in_ [_packages/contractkit/src/wallets/signers/signer.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L15)

#### Type declaration:

▸ \(`typedData`: EIP712TypedData\): _Promise‹object›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | EIP712TypedData |

