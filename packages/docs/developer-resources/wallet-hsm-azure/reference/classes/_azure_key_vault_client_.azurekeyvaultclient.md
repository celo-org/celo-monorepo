# Class: AzureKeyVaultClient

Provides an abstraction on Azure Key Vault for performing signing operations

## Hierarchy

* **AzureKeyVaultClient**

## Index

### Constructors

* [constructor](_azure_key_vault_client_.azurekeyvaultclient.md#constructor)

### Methods

* [getKeyId](_azure_key_vault_client_.azurekeyvaultclient.md#getkeyid)
* [getKeys](_azure_key_vault_client_.azurekeyvaultclient.md#getkeys)
* [getPublicKey](_azure_key_vault_client_.azurekeyvaultclient.md#getpublickey)
* [getSecret](_azure_key_vault_client_.azurekeyvaultclient.md#getsecret)
* [hasKey](_azure_key_vault_client_.azurekeyvaultclient.md#haskey)
* [signMessage](_azure_key_vault_client_.azurekeyvaultclient.md#signmessage)

## Constructors

###  constructor

\+ **new AzureKeyVaultClient**(`vaultName`: string, `credential?`: TokenCredential): *[AzureKeyVaultClient](_azure_key_vault_client_.azurekeyvaultclient.md)*

*Defined in [wallet-hsm-azure/src/azure-key-vault-client.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`vaultName` | string |
`credential?` | TokenCredential |

**Returns:** *[AzureKeyVaultClient](_azure_key_vault_client_.azurekeyvaultclient.md)*

## Methods

###  getKeyId

▸ **getKeyId**(`keyName`: string): *Promise‹string›*

*Defined in [wallet-hsm-azure/src/azure-key-vault-client.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹string›*

___

###  getKeys

▸ **getKeys**(): *Promise‹string[]›*

*Defined in [wallet-hsm-azure/src/azure-key-vault-client.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L54)*

**Returns:** *Promise‹string[]›*

___

###  getPublicKey

▸ **getPublicKey**(`keyName`: string): *Promise‹BigNumber›*

*Defined in [wallet-hsm-azure/src/azure-key-vault-client.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹BigNumber›*

___

###  getSecret

▸ **getSecret**(`secretName`: string): *Promise‹string›*

*Defined in [wallet-hsm-azure/src/azure-key-vault-client.ts:135](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L135)*

**Parameters:**

Name | Type |
------ | ------ |
`secretName` | string |

**Returns:** *Promise‹string›*

___

###  hasKey

▸ **hasKey**(`keyName`: string): *Promise‹boolean›*

*Defined in [wallet-hsm-azure/src/azure-key-vault-client.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L123)*

**Parameters:**

Name | Type |
------ | ------ |
`keyName` | string |

**Returns:** *Promise‹boolean›*

___

###  signMessage

▸ **signMessage**(`message`: Buffer, `keyName`: string): *Promise‹Signature›*

*Defined in [wallet-hsm-azure/src/azure-key-vault-client.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L82)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | Buffer |
`keyName` | string |

**Returns:** *Promise‹Signature›*
