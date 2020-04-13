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

*Defined in [src/wallets/signers/azure-key-vault-client.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`vaultName` | string |

**Returns:** *[AzureKeyVaultClient](_wallets_signers_azure_key_vault_client_.azurekeyvaultclient.md)*

## Methods

###  getKeyId

▸ **getKeyId**(`keyName`: string): *Promise‹string›*

*Defined in [src/wallets/signers/azure-key-vault-client.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L54)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹string›*

___

###  getKeys

▸ **getKeys**(): *Promise‹string[]›*

*Defined in [src/wallets/signers/azure-key-vault-client.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L33)*

**Returns:** *Promise‹string[]›*

___

###  getPublicKey

▸ **getPublicKey**(`keyName`: string): *Promise‹BigNumber›*

*Defined in [src/wallets/signers/azure-key-vault-client.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹BigNumber›*

___

###  hasKey

▸ **hasKey**(`keyName`: string): *Promise‹boolean›*

*Defined in [src/wallets/signers/azure-key-vault-client.ts:107](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L107)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹boolean›*

___

###  signMessage

▸ **signMessage**(`message`: Buffer, `keyName`: string): *Promise‹[Signature](_wallets_signers_azure_key_vault_client_.signature.md)›*

*Defined in [src/wallets/signers/azure-key-vault-client.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-key-vault-client.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | Buffer |
`keyName` | string |

**Returns:** *Promise‹[Signature](_wallets_signers_azure_key_vault_client_.signature.md)›*
