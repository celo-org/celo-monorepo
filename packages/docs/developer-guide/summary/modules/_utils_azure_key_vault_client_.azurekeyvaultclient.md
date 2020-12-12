# AzureKeyVaultClient

Provides an abstraction on Azure Key Vault for performing signing operations

## Hierarchy

* **AzureKeyVaultClient**

## Index

### Constructors

* [constructor]()

### Methods

* [getKeyId]()
* [getKeys]()
* [getPublicKey]()
* [getSecret]()
* [hasKey]()
* [signMessage]()

## Constructors

### constructor

+ **new AzureKeyVaultClient**\(`vaultName`: string, `credential?`: TokenCredential\): [_AzureKeyVaultClient_]()

_Defined in_ [_packages/contractkit/src/utils/azure-key-vault-client.ts:22_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L22)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `vaultName` | string |
| `credential?` | TokenCredential |

**Returns:** [_AzureKeyVaultClient_]()

## Methods

### getKeyId

▸ **getKeyId**\(`keyName`: string\): _Promise‹string›_

_Defined in_ [_packages/contractkit/src/utils/azure-key-vault-client.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L55)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keyName` | string |

**Returns:** _Promise‹string›_

### getKeys

▸ **getKeys**\(\): _Promise‹string\[\]›_

_Defined in_ [_packages/contractkit/src/utils/azure-key-vault-client.ts:34_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L34)

**Returns:** _Promise‹string\[\]›_

### getPublicKey

▸ **getPublicKey**\(`keyName`: string\): _Promise‹BigNumber›_

_Defined in_ [_packages/contractkit/src/utils/azure-key-vault-client.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L42)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keyName` | string |

**Returns:** _Promise‹BigNumber›_

### getSecret

▸ **getSecret**\(`secretName`: string\): _Promise‹string›_

_Defined in_ [_packages/contractkit/src/utils/azure-key-vault-client.ts:110_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L110)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `secretName` | string |

**Returns:** _Promise‹string›_

### hasKey

▸ **hasKey**\(`keyName`: string\): _Promise‹boolean›_

_Defined in_ [_packages/contractkit/src/utils/azure-key-vault-client.ts:98_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L98)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keyName` | string |

**Returns:** _Promise‹boolean›_

### signMessage

▸ **signMessage**\(`message`: Buffer, `keyName`: string\): _Promise‹_[_Signature_]()_›_

_Defined in_ [_packages/contractkit/src/utils/azure-key-vault-client.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/azure-key-vault-client.ts#L62)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | Buffer |
| `keyName` | string |

**Returns:** _Promise‹_[_Signature_]()_›_

