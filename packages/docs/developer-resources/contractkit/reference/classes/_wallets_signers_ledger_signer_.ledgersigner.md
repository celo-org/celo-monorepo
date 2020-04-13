# Class: LedgerSigner

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

###  constructor

\+ **new LedgerSigner**(`ledger`: any, `derivationPath`: string, `ledgerAddressValidation`: [AddressValidation](../enums/_wallets_ledger_wallet_.addressvalidation.md)): *[LedgerSigner](_wallets_signers_ledger_signer_.ledgersigner.md)*

*Defined in [src/wallets/signers/ledger-signer.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`ledger` | any |
`derivationPath` | string |
`ledgerAddressValidation` | [AddressValidation](../enums/_wallets_ledger_wallet_.addressvalidation.md) |

**Returns:** *[LedgerSigner](_wallets_signers_ledger_signer_.ledgersigner.md)*

## Methods

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [src/wallets/signers/ledger-signer.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L25)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [src/wallets/signers/ledger-signer.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L54)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)): *Promise‹object›*

*Defined in [src/wallets/signers/ledger-signer.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** *Promise‹object›*

___

###  signTypedData

▸ **signTypedData**(`typedData`: [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹object›*

*Defined in [src/wallets/signers/ledger-signer.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md) |

**Returns:** *Promise‹object›*
