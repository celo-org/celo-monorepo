# AzureKeyVaultClient

Provides an abstraction on Azure Key Vault for performing signing operations

## Hierarchy

* **AzureKeyVaultClient**

## Index

### Constructors

* [constructor](_utils_azure_key_vault_client_.azurekeyvaultclient.md#constructor)

### Methods

* [getKeyId](_utils_azure_key_vault_client_.azurekeyvaultclient.md#getkeyid)
* [getKeys](_utils_azure_key_vault_client_.azurekeyvaultclient.md#getkeys)
* [getPublicKey](_utils_azure_key_vault_client_.azurekeyvaultclient.md#getpublickey)
* [getSecret](_utils_azure_key_vault_client_.azurekeyvaultclient.md#getsecret)
* [hasKey](_utils_azure_key_vault_client_.azurekeyvaultclient.md#haskey)
* [signMessage](_utils_azure_key_vault_client_.azurekeyvaultclient.md#signmessage)

## Constructors

### constructor

+ **new AzureKeyVaultClient**\(`vaultName`: string\): [_AzureKeyVaultClient_](_utils_azure_key_vault_client_.azurekeyvaultclient.md)

_Defined in_ [_contractkit/src/utils/azure-key-vault-client.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L32)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `vaultName` | string |

**Returns:** [_AzureKeyVaultClient_](_utils_azure_key_vault_client_.azurekeyvaultclient.md)

## Methods

### getKeyId

▸ **getKeyId**\(`keyName`: string\): _Promise‹string›_

_Defined in_ [_contractkit/src/utils/azure-key-vault-client.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L65)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keyName` | string |

**Returns:** _Promise‹string›_

### getKeys

▸ **getKeys**\(\): _Promise‹string\[\]›_

_Defined in_ [_contractkit/src/utils/azure-key-vault-client.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L44)

**Returns:** _Promise‹string\[\]›_

### getPublicKey

▸ **getPublicKey**\(`keyName`: string\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/utils/azure-key-vault-client.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L52)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keyName` | string |

**Returns:** _Promise‹BigNumber›_

### getSecret

▸ **getSecret**\(`secretName`: string\): _Promise‹string›_

_Defined in_ [_contractkit/src/utils/azure-key-vault-client.ts:129_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L129)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `secretName` | string |

**Returns:** _Promise‹string›_

### hasKey

▸ **hasKey**\(`keyName`: string\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/utils/azure-key-vault-client.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L117)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keyName` | string |

**Returns:** _Promise‹boolean›_

### signMessage

▸ **signMessage**\(`message`: Buffer, `keyName`: string\): _Promise‹_[_Signature_](_utils_azure_key_vault_client_.signature.md)_›_

_Defined in_ [_contractkit/src/utils/azure-key-vault-client.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L72)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | Buffer |
| `keyName` | string |

**Returns:** _Promise‹_[_Signature_](_utils_azure_key_vault_client_.signature.md)_›_

