# Class: AzureKeyVaultClient

Provides an abstraction on Azure Key Vault for performing signing operations

## Hierarchy

* **AzureKeyVaultClient**

## Index

### Constructors

* [constructor](_wallets_signers_azure_key_vault_client_.azurekeyvaultclient.md#constructor)

### Methods

* [getKeyId](_wallets_signers_azure_key_vault_client_.azurekeyvaultclient.md#getkeyid)
* [getKeys](_wallets_signers_azure_key_vault_client_.azurekeyvaultclient.md#getkeys)
* [getPublicKey](_wallets_signers_azure_key_vault_client_.azurekeyvaultclient.md#getpublickey)
* [hasKey](_wallets_signers_azure_key_vault_client_.azurekeyvaultclient.md#haskey)
* [signMessage](_wallets_signers_azure_key_vault_client_.azurekeyvaultclient.md#signmessage)

## Constructors

###  constructor

\+ **new AzureKeyVaultClient**(`vaultName`: string): *[AzureKeyVaultClient](_wallets_signers_azure_key_vault_client_.azurekeyvaultclient.md)*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`vaultName` | string |

**Returns:** *[AzureKeyVaultClient](_wallets_signers_azure_key_vault_client_.azurekeyvaultclient.md)*

## Methods

###  getKeyId

▸ **getKeyId**(`keyName`: string): *Promise‹string›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹string›*

___

###  getKeys

▸ **getKeys**(): *Promise‹string[]›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L37)*

**Returns:** *Promise‹string[]›*

___

###  getPublicKey

▸ **getPublicKey**(`keyName`: string): *Promise‹BigNumber›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹BigNumber›*

___

###  hasKey

▸ **hasKey**(`keyName`: string): *Promise‹boolean›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L111)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹boolean›*

___

###  signMessage

▸ **signMessage**(`message`: Buffer, `keyName`: string): *Promise‹[Signature](_wallets_signers_azure_key_vault_client_.signature.md)›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L65)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | Buffer |
`keyName` | string |

**Returns:** *Promise‹[Signature](_wallets_signers_azure_key_vault_client_.signature.md)›*
