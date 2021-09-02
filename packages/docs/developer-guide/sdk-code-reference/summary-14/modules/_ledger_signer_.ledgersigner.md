# LedgerSigner

Signs the EVM transaction with a Ledger device

## Hierarchy

* **LedgerSigner**

## Implements

* Signer

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

_Defined in_ [_wallet-ledger/src/ledger-signer.ts:22_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L22)

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

_Defined in_ [_wallet-ledger/src/ledger-signer.ts:196_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L196)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_publicKey` | string |

**Returns:** _Promise‹Buffer‹››_

### decrypt

▸ **decrypt**\(`_ciphertext`: Buffer\): _Promise‹Buffer‹››_

_Defined in_ [_wallet-ledger/src/ledger-signer.ts:190_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L190)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_ciphertext` | Buffer |

**Returns:** _Promise‹Buffer‹››_

### getNativeKey

▸ **getNativeKey**\(\): _string_

_Defined in_ [_wallet-ledger/src/ledger-signer.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L39)

**Returns:** _string_

### signPersonalMessage

▸ **signPersonalMessage**\(`data`: string\): _Promise‹object›_

_Defined in_ [_wallet-ledger/src/ledger-signer.ts:82_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L82)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** _Promise‹object›_

### signTransaction

▸ **signTransaction**\(`addToV`: number, `encodedTx`: RLPEncodedTx\): _Promise‹object›_

_Defined in_ [_wallet-ledger/src/ledger-signer.ts:43_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L43)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | RLPEncodedTx |

**Returns:** _Promise‹object›_

### signTypedData

▸ **signTypedData**\(`typedData`: EIP712TypedData\): _Promise‹object›_

_Defined in_ [_wallet-ledger/src/ledger-signer.ts:103_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L103)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | EIP712TypedData |

**Returns:** _Promise‹object›_

