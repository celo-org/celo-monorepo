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

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`vaultName` | string |

**Returns:** *[AzureKeyVaultClient](_wallets_signers_azure_key_vault_client_.azurekeyvaultclient.md)*

## Methods

###  getKeyId

▸ **getKeyId**(`keyName`: string): *Promise‹string›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹string›*

___

###  getKeys

▸ **getKeys**(): *Promise‹string[]›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L41)*

**Returns:** *Promise‹string[]›*

___

###  getPublicKey

▸ **getPublicKey**(`keyName`: string): *Promise‹BigNumber›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹BigNumber›*

___

###  hasKey

▸ **hasKey**(`keyName`: string): *Promise‹boolean›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L114)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹boolean›*

___

###  signMessage

▸ **signMessage**(`message`: Buffer, `keyName`: string): *Promise‹[Signature](_wallets_signers_azure_key_vault_client_.signature.md)›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | Buffer |
`keyName` | string |

**Returns:** *Promise‹[Signature](_wallets_signers_azure_key_vault_client_.signature.md)›*
