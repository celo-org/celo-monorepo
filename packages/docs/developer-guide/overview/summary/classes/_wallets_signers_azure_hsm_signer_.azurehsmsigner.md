# AzureHSMSigner

Signs the EVM transaction using an HSM key in Azure Key Vault

## Hierarchy

* **AzureHSMSigner**

## Implements

* [Signer](../interfaces/_wallets_signers_signer_.signer.md)

## Index

### Constructors

* [constructor](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#constructor)

### Methods

* [getNativeKey](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#getnativekey)
* [signPersonalMessage](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#signpersonalmessage)
* [signTransaction](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#signtransaction)

## Constructors

### constructor

+ **new AzureHSMSigner**\(`keyVaultClient`: [AzureKeyVaultClient](_utils_azure_key_vault_client_.azurekeyvaultclient.md), `keyName`: string\): [_AzureHSMSigner_](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md)

_Defined in_ [_contractkit/src/wallets/signers/azure-hsm-signer.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L12)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keyVaultClient` | [AzureKeyVaultClient](_utils_azure_key_vault_client_.azurekeyvaultclient.md) |
| `keyName` | string |

**Returns:** [_AzureHSMSigner_](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md)

## Methods

### getNativeKey

▸ **getNativeKey**\(\): _string_

_Defined in_ [_contractkit/src/wallets/signers/azure-hsm-signer.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L56)

**Returns:** _string_

### signPersonalMessage

▸ **signPersonalMessage**\(`data`: string\): _Promise‹object›_

_Defined in_ [_contractkit/src/wallets/signers/azure-hsm-signer.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L38)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** _Promise‹object›_

### signTransaction

▸ **signTransaction**\(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)\): _Promise‹object›_

_Defined in_ [_contractkit/src/wallets/signers/azure-hsm-signer.ts:22_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L22)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** _Promise‹object›_

