# Class: AzureKeyVaultClient

Provides an abstraction on Azure Key Vault for performing signing operations

## Hierarchy

* **AzureKeyVaultClient**

## Index

### Constructors

* [constructor](_contractkit_src_utils_azure_key_vault_client_.azurekeyvaultclient.md#constructor)

### Methods

* [getKeyId](_contractkit_src_utils_azure_key_vault_client_.azurekeyvaultclient.md#getkeyid)
* [getKeys](_contractkit_src_utils_azure_key_vault_client_.azurekeyvaultclient.md#getkeys)
* [getPublicKey](_contractkit_src_utils_azure_key_vault_client_.azurekeyvaultclient.md#getpublickey)
* [getSecret](_contractkit_src_utils_azure_key_vault_client_.azurekeyvaultclient.md#getsecret)
* [hasKey](_contractkit_src_utils_azure_key_vault_client_.azurekeyvaultclient.md#haskey)
* [signMessage](_contractkit_src_utils_azure_key_vault_client_.azurekeyvaultclient.md#signmessage)

## Constructors

###  constructor

\+ **new AzureKeyVaultClient**(`vaultName`: string): *[AzureKeyVaultClient](_contractkit_src_utils_azure_key_vault_client_.azurekeyvaultclient.md)*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`vaultName` | string |

**Returns:** *[AzureKeyVaultClient](_contractkit_src_utils_azure_key_vault_client_.azurekeyvaultclient.md)*

## Methods

###  getKeyId

▸ **getKeyId**(`keyName`: string): *Promise‹string›*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L60)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹string›*

___

###  getKeys

▸ **getKeys**(): *Promise‹string[]›*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L39)*

**Returns:** *Promise‹string[]›*

___

###  getPublicKey

▸ **getPublicKey**(`keyName`: string): *Promise‹BigNumber›*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹BigNumber›*

___

###  getSecret

▸ **getSecret**(`secretName`: string): *Promise‹string›*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`secretName` | string |

**Returns:** *Promise‹string›*

___

###  hasKey

▸ **hasKey**(`keyName`: string): *Promise‹boolean›*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:108](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L108)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹boolean›*

___

###  signMessage

▸ **signMessage**(`message`: Buffer, `keyName`: string): *Promise‹[Signature](_contractkit_src_utils_signature_utils_.signature.md)›*

*Defined in [contractkit/src/utils/azure-key-vault-client.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L67)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | Buffer |
`keyName` | string |

**Returns:** *Promise‹[Signature](_contractkit_src_utils_signature_utils_.signature.md)›*
