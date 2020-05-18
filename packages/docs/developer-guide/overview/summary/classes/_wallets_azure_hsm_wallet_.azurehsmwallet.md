# AzureHSMWallet

## Hierarchy

↳ [RemoteWallet](_wallets_remote_wallet_.remotewallet.md)

↳ **AzureHSMWallet**

## Implements

* [Wallet](../interfaces/_wallets_wallet_.wallet.md)
* [Wallet](../interfaces/_wallets_wallet_.wallet.md)
* [Wallet](../interfaces/_wallets_wallet_.wallet.md)

## Index

### Constructors

* [constructor](_wallets_azure_hsm_wallet_.azurehsmwallet.md#constructor)

### Methods

* [getAccounts](_wallets_azure_hsm_wallet_.azurehsmwallet.md#getaccounts)
* [getAddressFromKeyName](_wallets_azure_hsm_wallet_.azurehsmwallet.md#getaddressfromkeyname)
* [hasAccount](_wallets_azure_hsm_wallet_.azurehsmwallet.md#hasaccount)
* [init](_wallets_azure_hsm_wallet_.azurehsmwallet.md#init)
* [signPersonalMessage](_wallets_azure_hsm_wallet_.azurehsmwallet.md#signpersonalmessage)
* [signTransaction](_wallets_azure_hsm_wallet_.azurehsmwallet.md#signtransaction)
* [signTypedData](_wallets_azure_hsm_wallet_.azurehsmwallet.md#signtypeddata)

## Constructors

### constructor

+ **new AzureHSMWallet**\(`vaultName`: string\): [_AzureHSMWallet_](_wallets_azure_hsm_wallet_.azurehsmwallet.md)

_Defined in_ [_contractkit/src/wallets/azure-hsm-wallet.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/azure-hsm-wallet.ts#L12)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `vaultName` | string |

**Returns:** [_AzureHSMWallet_](_wallets_azure_hsm_wallet_.azurehsmwallet.md)

## Methods

### getAccounts

▸ **getAccounts**\(\): [_Address_](../external-modules/_base_.md#address)_\[\]_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_getAccounts_](_wallets_remote_wallet_.remotewallet.md#getaccounts)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_getAccounts_](_wallets_wallet_.walletbase.md#getaccounts)

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L61)

Get a list of accounts in the remote wallet

**Returns:** [_Address_](../external-modules/_base_.md#address)_\[\]_

### getAddressFromKeyName

▸ **getAddressFromKeyName**\(`keyName`: string\): _Promise‹_[_Address_](../external-modules/_base_.md#address)_›_

_Defined in_ [_contractkit/src/wallets/azure-hsm-wallet.ts:49_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/azure-hsm-wallet.ts#L49)

Returns the EVM address for the given key Useful for initially getting the 'from' field given a keyName

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `keyName` | string | Azure KeyVault key name |

**Returns:** _Promise‹_[_Address_](../external-modules/_base_.md#address)_›_

### hasAccount

▸ **hasAccount**\(`address?`: [Address](../external-modules/_base_.md#address)\): _boolean_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_hasAccount_](_wallets_remote_wallet_.remotewallet.md#hasaccount)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_hasAccount_](_wallets_wallet_.walletbase.md#hasaccount)

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L70)

Returns true if account is in the remote wallet

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | [Address](../external-modules/_base_.md#address) | Account to check |

**Returns:** _boolean_

### init

▸ **init**\(\): _Promise‹void›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_init_](_wallets_remote_wallet_.remotewallet.md#init)

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L20)

Discovers wallet accounts and caches results in memory Idempotent to ensure multiple calls are benign

**Returns:** _Promise‹void›_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: [Address](../external-modules/_base_.md#address), `data`: string\): _Promise‹string›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_signPersonalMessage_](_wallets_remote_wallet_.remotewallet.md#signpersonalmessage)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signPersonalMessage_](_wallets_wallet_.walletbase.md#signpersonalmessage)

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:89_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L89)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../external-modules/_base_.md#address) | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: Tx\): _Promise‹EncodedTransaction›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_signTransaction_](_wallets_remote_wallet_.remotewallet.md#signtransaction)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signTransaction_](_wallets_wallet_.walletbase.md#signtransaction)

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:79_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L79)

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | Tx | EVM transaction |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: [Address](../external-modules/_base_.md#address), `typedData`: [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md)\): _Promise‹string›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_signTypedData_](_wallets_remote_wallet_.remotewallet.md#signtypeddata)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signTypedData_](_wallets_wallet_.walletbase.md#signtypeddata)

_Defined in_ [_contractkit/src/wallets/remote-wallet.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L99)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../external-modules/_base_.md#address) | Address of the account to sign with |
| `typedData` | [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md) | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

