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

\+ **new LedgerSigner**(`ledger`: any, `derivationPath`: string): *[LedgerSigner](_wallets_signers_ledger_signer_.ledgersigner.md)*

*Defined in [contractkit/src/wallets/signers/ledger-signer.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`ledger` | any |
`derivationPath` | string |

**Returns:** *[LedgerSigner](_wallets_signers_ledger_signer_.ledgersigner.md)*

## Methods

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [contractkit/src/wallets/signers/ledger-signer.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L21)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/ledger-signer.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/ledger-signer.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** *Promise‹object›*

___

###  signTypedData

▸ **signTypedData**(`typedData`: [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/ledger-signer.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/ledger-signer.ts#L71)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md) |

**Returns:** *Promise‹object›*
