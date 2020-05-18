# LedgerSigner

Signs the EVM transaction with a Ledger device

## Hierarchy

* **LedgerSigner**

## Implements

* [Signer](../interfaces/_wallets_signers_signer_.signer.md)

## Index

### Constructors

* [constructor](_wallets_signers_ledger_signer_.ledgersigner.md#constructor)

### Methods

* [getNativeKey](_wallets_signers_ledger_signer_.ledgersigner.md#getnativekey)
* [signPersonalMessage](_wallets_signers_ledger_signer_.ledgersigner.md#signpersonalmessage)
* [signTransaction](_wallets_signers_ledger_signer_.ledgersigner.md#signtransaction)
* [signTypedData](_wallets_signers_ledger_signer_.ledgersigner.md#signtypeddata)

## Constructors

### constructor

+ **new LedgerSigner**\(`ledger`: any, `derivationPath`: string, `ledgerAddressValidation`: [AddressValidation](../enums/_wallets_ledger_wallet_.addressvalidation.md), `appConfiguration`: object\): [_LedgerSigner_](_wallets_signers_ledger_signer_.ledgersigner.md)

_Defined in_ [_contractkit/src/wallets/signers/ledger-signer.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L23)

**Parameters:**

▪ **ledger**: _any_

▪ **derivationPath**: _string_

▪ **ledgerAddressValidation**: [_AddressValidation_](../enums/_wallets_ledger_wallet_.addressvalidation.md)

▪`Default value` **appConfiguration**: _object_= { arbitraryDataEnabled: 0, version: '0.0.0', }

| Name | Type |
| :--- | :--- |
| `arbitraryDataEnabled` | number |
| `version` | string |

**Returns:** [_LedgerSigner_](_wallets_signers_ledger_signer_.ledgersigner.md)

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

▸ **signTransaction**\(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)\): _Promise‹object›_

_Defined in_ [_contractkit/src/wallets/signers/ledger-signer.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L44)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** _Promise‹object›_

### signTypedData

▸ **signTypedData**\(`typedData`: [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md)\): _Promise‹object›_

_Defined in_ [_contractkit/src/wallets/signers/ledger-signer.ts:104_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L104)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md) |

**Returns:** _Promise‹object›_

