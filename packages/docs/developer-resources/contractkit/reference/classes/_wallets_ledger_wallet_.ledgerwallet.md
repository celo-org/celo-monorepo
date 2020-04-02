# Class: LedgerWallet

## Hierarchy

* **LedgerWallet**

## Implements

* [Wallet](../interfaces/_wallets_wallet_.wallet.md)

## Index

### Constructors

* [constructor](_wallets_ledger_wallet_.ledgerwallet.md#constructor)

### Properties

* [baseDerivationPath](_wallets_ledger_wallet_.ledgerwallet.md#basederivationpath)
* [derivationPathIndexes](_wallets_ledger_wallet_.ledgerwallet.md#derivationpathindexes)

### Methods

* [getAccounts](_wallets_ledger_wallet_.ledgerwallet.md#getaccounts)
* [hasAccount](_wallets_ledger_wallet_.ledgerwallet.md#hasaccount)
* [init](_wallets_ledger_wallet_.ledgerwallet.md#init)
* [signPersonalMessage](_wallets_ledger_wallet_.ledgerwallet.md#signpersonalmessage)
* [signTransaction](_wallets_ledger_wallet_.ledgerwallet.md#signtransaction)
* [signTypedData](_wallets_ledger_wallet_.ledgerwallet.md#signtypeddata)

## Constructors

###  constructor

\+ **new LedgerWallet**(`derivationPathIndexes`: number[], `baseDerivationPath`: string): *[LedgerWallet](_wallets_ledger_wallet_.ledgerwallet.md)*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L43)*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`derivationPathIndexes` | number[] | Array.from(Array(ADDRESS_QTY).keys()) | number array of "address_index" for the base derivation path. Default: Array[0..9]. Example: [3, 99, 53] will retrieve the derivation paths of [`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`] |
`baseDerivationPath` | string | CELO_BASE_DERIVATION_PATH | base derivation path. Default: "44'/52752'/0'/0"  |

**Returns:** *[LedgerWallet](_wallets_ledger_wallet_.ledgerwallet.md)*

## Properties

###  baseDerivationPath

• **baseDerivationPath**: *string*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L54)*

base derivation path. Default: "44'/52752'/0'/0"

___

###  derivationPathIndexes

• **derivationPathIndexes**: *number[]*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L53)*

number array of "address_index" for the base derivation path.
Default: Array[0..9].
Example: [3, 99, 53] will retrieve the derivation paths of
[`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`]

## Methods

###  getAccounts

▸ **getAccounts**(): *[Address](../modules/_base_.md#address)[]*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L118)*

**Returns:** *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: undefined | string): *boolean*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L123)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | undefined &#124; string |

**Returns:** *boolean*

___

###  init

▸ **init**(`transport`: any): *Promise‹void›*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L67)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`transport` | any | Transport to connect the ledger device  |

**Returns:** *Promise‹void›*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: string, `data`: string): *Promise‹string›*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:162](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L162)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Address of the account to sign with |
`data` | string | Hex string message to sign |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  signTransaction

▸ **signTransaction**(`txParams`: Tx): *Promise‹EncodedTransaction›*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:132](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L132)*

**Parameters:**

Name | Type |
------ | ------ |
`txParams` | Tx |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: [Address](../modules/_base_.md#address), `typedData`: [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹string›*

*Defined in [contractkit/src/wallets/ledger-wallet.ts:189](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-wallet.ts#L189)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
`typedData` | [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md) | - |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
