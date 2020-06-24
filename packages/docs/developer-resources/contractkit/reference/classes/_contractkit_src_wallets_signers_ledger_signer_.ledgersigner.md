# Class: LedgerSigner

Signs the EVM transaction with a Ledger device

## Hierarchy

* **LedgerSigner**

## Implements

* [Signer](../interfaces/_contractkit_src_wallets_signers_signer_.signer.md)

## Index

### Constructors

* [constructor](_contractkit_src_wallets_signers_ledger_signer_.ledgersigner.md#constructor)

### Methods

* [getNativeKey](_contractkit_src_wallets_signers_ledger_signer_.ledgersigner.md#getnativekey)
* [signPersonalMessage](_contractkit_src_wallets_signers_ledger_signer_.ledgersigner.md#signpersonalmessage)
* [signTransaction](_contractkit_src_wallets_signers_ledger_signer_.ledgersigner.md#signtransaction)
* [signTypedData](_contractkit_src_wallets_signers_ledger_signer_.ledgersigner.md#signtypeddata)

## Constructors

###  constructor

\+ **new LedgerSigner**(`ledger`: any, `derivationPath`: string, `ledgerAddressValidation`: [AddressValidation](../enums/_contractkit_src_wallets_ledger_wallet_.addressvalidation.md), `appConfiguration`: object): *[LedgerSigner](_contractkit_src_wallets_signers_ledger_signer_.ledgersigner.md)*

*Defined in [contractkit/src/wallets/signers/ledger-signer.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L23)*

**Parameters:**

▪ **ledger**: *any*

▪ **derivationPath**: *string*

▪ **ledgerAddressValidation**: *[AddressValidation](../enums/_contractkit_src_wallets_ledger_wallet_.addressvalidation.md)*

▪`Default value`  **appConfiguration**: *object*= {
      arbitraryDataEnabled: 0,
      version: '0.0.0',
    }

Name | Type |
------ | ------ |
`arbitraryDataEnabled` | number |
`version` | string |

**Returns:** *[LedgerSigner](_contractkit_src_wallets_signers_ledger_signer_.ledgersigner.md)*

## Methods

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [contractkit/src/wallets/signers/ledger-signer.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L40)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/ledger-signer.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_contractkit_src_utils_signing_utils_.rlpencodedtx.md)): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/ledger-signer.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | [RLPEncodedTx](../interfaces/_contractkit_src_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** *Promise‹object›*

___

###  signTypedData

▸ **signTypedData**(`typedData`: [EIP712TypedData](../interfaces/_contractkit_src_utils_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/ledger-signer.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L104)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_contractkit_src_utils_sign_typed_data_utils_.eip712typeddata.md) |

**Returns:** *Promise‹object›*
