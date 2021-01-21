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

_Defined in_ [_wallet-hsm-azure/src/azure-key-vault-client.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L30)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `vaultName` | string |
| `credential?` | TokenCredential |

**Returns:** [_AzureKeyVaultClient_]()

## Methods

### getKeyId

▸ **getKeyId**\(`keyName`: string\): _Promise‹string›_

_Defined in_ [_wallet-hsm-azure/src/azure-key-vault-client.ts:63_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L63)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keyName` | string |

**Returns:** _Promise‹string›_

### getKeys

▸ **getKeys**\(\): _Promise‹string\[\]›_

_Defined in_ [_wallet-hsm-azure/src/azure-key-vault-client.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L42)

**Returns:** _Promise‹string\[\]›_

### getPublicKey

▸ **getPublicKey**\(`keyName`: string\): _Promise‹BigNumber›_

_Defined in_ [_wallet-hsm-azure/src/azure-key-vault-client.ts:50_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L50)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keyName` | string |

**Returns:** _Promise‹BigNumber›_

### getSecret

▸ **getSecret**\(`secretName`: string\): _Promise‹string›_

_Defined in_ [_wallet-hsm-azure/src/azure-key-vault-client.ts:118_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L118)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `secretName` | string |

**Returns:** _Promise‹string›_

### hasKey

▸ **hasKey**\(`keyName`: string\): _Promise‹boolean›_

_Defined in_ [_wallet-hsm-azure/src/azure-key-vault-client.ts:106_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L106)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keyName` | string |

**Returns:** _Promise‹boolean›_

### signMessage

▸ **signMessage**\(`message`: Buffer, `keyName`: string\): _Promise‹Signature›_

_Defined in_ [_wallet-hsm-azure/src/azure-key-vault-client.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-key-vault-client.ts#L70)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | Buffer |
| `keyName` | string |

**Returns:** _Promise‹Signature›_

