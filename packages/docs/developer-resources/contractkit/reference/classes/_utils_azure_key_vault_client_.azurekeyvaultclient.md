# Class: AzureKeyVaultClient

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

###  constructor

\+ **new AzureKeyVaultClient**(`vaultName`: string): *[AzureKeyVaultClient](_utils_azure_key_vault_client_.azurekeyvaultclient.md)*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`vaultName` | string |

**Returns:** *[AzureKeyVaultClient](_utils_azure_key_vault_client_.azurekeyvaultclient.md)*

## Methods

###  getKeyId

▸ **getKeyId**(`keyName`: string): *Promise‹string›*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L65)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹string›*

___

###  getKeys

▸ **getKeys**(): *Promise‹string[]›*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L44)*

**Returns:** *Promise‹string[]›*

___

###  getPublicKey

▸ **getPublicKey**(`keyName`: string): *Promise‹BigNumber›*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹BigNumber›*

___

###  getSecret

▸ **getSecret**(`secretName`: string): *Promise‹string›*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:129](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L129)*

**Parameters:**

Name | Type |
------ | ------ |
`secretName` | string |

**Returns:** *Promise‹string›*

___

###  hasKey

▸ **hasKey**(`keyName`: string): *Promise‹boolean›*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L117)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹boolean›*

___

###  signMessage

▸ **signMessage**(`message`: Buffer, `keyName`: string): *Promise‹[Signature](_utils_azure_key_vault_client_.signature.md)›*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | Buffer |
`keyName` | string |

**Returns:** *Promise‹[Signature](_utils_azure_key_vault_client_.signature.md)›*
