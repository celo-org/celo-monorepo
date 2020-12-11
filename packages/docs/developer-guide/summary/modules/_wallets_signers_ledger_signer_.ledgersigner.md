# LedgerSigner

Signs the EVM transaction with a Ledger device

## Hierarchy

* **LedgerSigner**

## Implements

* [Signer]()

## Index

### Constructors

* [constructor]()

### Methods

* [computeSharedSecret]()
* [decrypt]()
* [getNativeKey]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

## Constructors

### constructor

+ **new LedgerSigner**\(`ledger`: any, `derivationPath`: string, `ledgerAddressValidation`: [AddressValidation](), `appConfiguration`: object\): [_LedgerSigner_]()

_Defined in_ [_packages/contractkit/src/wallets/signers/ledger-signer.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L23)

**Parameters:**

▪ **ledger**: _any_

▪ **derivationPath**: _string_

▪ **ledgerAddressValidation**: [_AddressValidation_]()

▪`Default value` **appConfiguration**: _object_= { arbitraryDataEnabled: 0, version: '0.0.0', }

| Name | Type |
| :--- | :--- |
| `arbitraryDataEnabled` | number |
| `version` | string |

**Returns:** [_LedgerSigner_]()

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`_publicKey`: string\): _Promise‹Buffer‹››_

_Defined in_ [_packages/contractkit/src/wallets/signers/ledger-signer.ts:197_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L197)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_publicKey` | string |

**Returns:** _Promise‹Buffer‹››_

### decrypt

▸ **decrypt**\(`_ciphertext`: Buffer\): _Promise‹Buffer‹››_

_Defined in_ [_packages/contractkit/src/wallets/signers/ledger-signer.ts:191_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L191)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_ciphertext` | Buffer |

**Returns:** _Promise‹Buffer‹››_

### getNativeKey

▸ **getNativeKey**\(\): _string_

_Defined in_ [_packages/contractkit/src/wallets/signers/ledger-signer.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L40)

**Returns:** _string_

### signPersonalMessage

▸ **signPersonalMessage**\(`data`: string\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wallets/signers/ledger-signer.ts:83_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L83)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** _Promise‹object›_

### signTransaction

▸ **signTransaction**\(`addToV`: number, `encodedTx`: [RLPEncodedTx]()\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wallets/signers/ledger-signer.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L44)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | [RLPEncodedTx]() |

**Returns:** _Promise‹object›_

### signTypedData

▸ **signTypedData**\(`typedData`: EIP712TypedData\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wallets/signers/ledger-signer.ts:104_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L104)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | EIP712TypedData |

**Returns:** _Promise‹object›_

