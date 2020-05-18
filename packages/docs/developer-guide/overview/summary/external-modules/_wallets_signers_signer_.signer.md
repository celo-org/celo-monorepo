# Signer

## Hierarchy

* **Signer**

## Implemented by

* [AzureHSMSigner]()
* [LedgerSigner]()
* [LocalSigner]()

## Index

### Properties

* [getNativeKey]()
* [signPersonalMessage]()
* [signTransaction]()

## Properties

### getNativeKey

• **getNativeKey**: _function_

_Defined in_ [_contractkit/src/wallets/signers/signer.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L14)

#### Type declaration:

▸ \(\): _string_

### signPersonalMessage

• **signPersonalMessage**: _function_

_Defined in_ [_contractkit/src/wallets/signers/signer.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L13)

#### Type declaration:

▸ \(`data`: string\): _Promise‹object›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

### signTransaction

• **signTransaction**: _function_

_Defined in_ [_contractkit/src/wallets/signers/signer.ts:9_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/signer.ts#L9)

Signs the message and returns an EVM transaction

**`param`** represents the chainId and is added to the recoveryId to prevent replay

**`param`** is the RLPEncoded transaction object

#### Type declaration:

▸ \(`addToV`: number, `encodedTx`: [RLPEncodedTx]()\): _Promise‹object›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | [RLPEncodedTx]() |

