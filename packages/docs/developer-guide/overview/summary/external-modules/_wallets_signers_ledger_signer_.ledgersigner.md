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

* [getNativeKey]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

## Constructors

### constructor

+ **new LedgerSigner**\(`ledger`: any, `derivationPath`: string, `ledgerAddressValidation`: [AddressValidation](), `appConfiguration`: object\): [_LedgerSigner_]()

_Defined in_ [_contractkit/src/wallets/signers/ledger-signer.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L23)

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

### getNativeKey

▸ **getNativeKey**\(\): _string_

_Defined in_ [_contractkit/src/wallets/signers/ledger-signer.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L40)

**Returns:** _string_

### signPersonalMessage

▸ **signPersonalMessage**\(`data`: string\): _Promise‹object›_

_Defined in_ [_contractkit/src/wallets/signers/ledger-signer.ts:83_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L83)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** _Promise‹object›_

### signTransaction

▸ **signTransaction**\(`addToV`: number, `encodedTx`: [RLPEncodedTx]()\): _Promise‹object›_

_Defined in_ [_contractkit/src/wallets/signers/ledger-signer.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L44)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | [RLPEncodedTx]() |

**Returns:** _Promise‹object›_

### signTypedData

▸ **signTypedData**\(`typedData`: [EIP712TypedData]()\): _Promise‹object›_

_Defined in_ [_contractkit/src/wallets/signers/ledger-signer.ts:104_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L104)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | [EIP712TypedData]() |

**Returns:** _Promise‹object›_

