# Class: LedgerSigner

Signs the EVM transaction with a Ledger device

## Hierarchy

* **LedgerSigner**

## Implements

* Signer

## Index

### Constructors

* [constructor](_ledger_signer_.ledgersigner.md#constructor)

### Methods

* [computeSharedSecret](_ledger_signer_.ledgersigner.md#computesharedsecret)
* [decrypt](_ledger_signer_.ledgersigner.md#decrypt)
* [getNativeKey](_ledger_signer_.ledgersigner.md#getnativekey)
* [signPersonalMessage](_ledger_signer_.ledgersigner.md#signpersonalmessage)
* [signTransaction](_ledger_signer_.ledgersigner.md#signtransaction)
* [signTypedData](_ledger_signer_.ledgersigner.md#signtypeddata)

## Constructors

###  constructor

\+ **new LedgerSigner**(`ledger`: any, `derivationPath`: string, `ledgerAddressValidation`: [AddressValidation](../enums/_ledger_wallet_.addressvalidation.md), `appConfiguration`: object): *[LedgerSigner](_ledger_signer_.ledgersigner.md)*

*Defined in [wallet-ledger/src/ledger-signer.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L22)*

**Parameters:**

▪ **ledger**: *any*

▪ **derivationPath**: *string*

▪ **ledgerAddressValidation**: *[AddressValidation](../enums/_ledger_wallet_.addressvalidation.md)*

▪`Default value`  **appConfiguration**: *object*= {
      arbitraryDataEnabled: 0,
      version: '0.0.0',
    }

Name | Type |
------ | ------ |
`arbitraryDataEnabled` | number |
`version` | string |

**Returns:** *[LedgerSigner](_ledger_signer_.ledgersigner.md)*

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`_publicKey`: string): *Promise‹Buffer‹››*

*Defined in [wallet-ledger/src/ledger-signer.ts:196](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L196)*

**Parameters:**

Name | Type |
------ | ------ |
`_publicKey` | string |

**Returns:** *Promise‹Buffer‹››*

___

###  decrypt

▸ **decrypt**(`_ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [wallet-ledger/src/ledger-signer.ts:190](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L190)*

**Parameters:**

Name | Type |
------ | ------ |
`_ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [wallet-ledger/src/ledger-signer.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L39)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [wallet-ledger/src/ledger-signer.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L82)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: RLPEncodedTx): *Promise‹object›*

*Defined in [wallet-ledger/src/ledger-signer.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | RLPEncodedTx |

**Returns:** *Promise‹object›*

___

###  signTypedData

▸ **signTypedData**(`typedData`: EIP712TypedData): *Promise‹object›*

*Defined in [wallet-ledger/src/ledger-signer.ts:103](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/ledger-signer.ts#L103)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹object›*
