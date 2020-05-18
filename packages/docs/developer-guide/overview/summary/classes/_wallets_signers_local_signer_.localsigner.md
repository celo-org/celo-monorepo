# LocalSigner

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

### constructor

+ **new LocalSigner**\(`privateKey`: string\): [_LocalSigner_](_wallets_signers_local_signer_.localsigner.md)

_Defined in_ [_contractkit/src/wallets/signers/local-signer.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L12)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |

**Returns:** [_LocalSigner_](_wallets_signers_local_signer_.localsigner.md)

## Methods

### getNativeKey

▸ **getNativeKey**\(\): _string_

_Defined in_ [_contractkit/src/wallets/signers/local-signer.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L18)

**Returns:** _string_

### signPersonalMessage

▸ **signPersonalMessage**\(`data`: string\): _Promise‹object›_

_Defined in_ [_contractkit/src/wallets/signers/local-signer.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L36)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** _Promise‹object›_

### signTransaction

▸ **signTransaction**\(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)\): _Promise‹object›_

_Defined in_ [_contractkit/src/wallets/signers/local-signer.ts:22_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/local-signer.ts#L22)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** _Promise‹object›_

