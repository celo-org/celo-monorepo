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

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`vaultName` | string |

**Returns:** *[AzureKeyVaultClient](_wallets_signers_azure_key_vault_client_.azurekeyvaultclient.md)*

## Methods

###  getKeyId

▸ **getKeyId**(`keyName`: string): *Promise‹string›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹string›*

___

###  getKeys

▸ **getKeys**(): *Promise‹string[]›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L34)*

**Returns:** *Promise‹string[]›*

___

###  getPublicKey

▸ **getPublicKey**(`keyName`: string): *Promise‹BigNumber›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹BigNumber›*

___

###  hasKey

▸ **hasKey**(`keyName`: string): *Promise‹boolean›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:107](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L107)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹boolean›*

___

###  signMessage

▸ **signMessage**(`message`: Buffer, `keyName`: string): *Promise‹[Signature](_wallets_signers_azure_key_vault_client_.signature.md)›*

*Defined in [contractkit/src/wallets/signers/azure-key-vault-client.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | Buffer |
`keyName` | string |

**Returns:** *Promise‹[Signature](_wallets_signers_azure_key_vault_client_.signature.md)›*
