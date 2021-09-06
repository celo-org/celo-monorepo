# Class: AzureHSMSigner

Signs the EVM transaction using an HSM key in Azure Key Vault

## Hierarchy

* **AzureHSMSigner**

## Implements

* Signer

## Index

### Constructors

* [constructor](_azure_hsm_signer_.azurehsmsigner.md#constructor)

### Methods

* [computeSharedSecret](_azure_hsm_signer_.azurehsmsigner.md#computesharedsecret)
* [decrypt](_azure_hsm_signer_.azurehsmsigner.md#decrypt)
* [getNativeKey](_azure_hsm_signer_.azurehsmsigner.md#getnativekey)
* [signPersonalMessage](_azure_hsm_signer_.azurehsmsigner.md#signpersonalmessage)
* [signTransaction](_azure_hsm_signer_.azurehsmsigner.md#signtransaction)
* [signTypedData](_azure_hsm_signer_.azurehsmsigner.md#signtypeddata)

## Constructors

###  constructor

\+ **new AzureHSMSigner**(`keyVaultClient`: [AzureKeyVaultClient](_azure_key_vault_client_.azurekeyvaultclient.md), `keyName`: string): *[AzureHSMSigner](_azure_hsm_signer_.azurehsmsigner.md)*

*Defined in [wallet-hsm-azure/src/azure-hsm-signer.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-hsm-signer.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`keyVaultClient` | [AzureKeyVaultClient](_azure_key_vault_client_.azurekeyvaultclient.md) |
`keyName` | string |

**Returns:** *[AzureHSMSigner](_azure_hsm_signer_.azurehsmsigner.md)*

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`_publicKey`: string): *Promise‹Buffer‹››*

*Defined in [wallet-hsm-azure/src/azure-hsm-signer.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-hsm-signer.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`_publicKey` | string |

**Returns:** *Promise‹Buffer‹››*

___

###  decrypt

▸ **decrypt**(`_ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [wallet-hsm-azure/src/azure-hsm-signer.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-hsm-signer.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`_ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [wallet-hsm-azure/src/azure-hsm-signer.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-hsm-signer.ts#L71)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [wallet-hsm-azure/src/azure-hsm-signer.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-hsm-signer.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: RLPEncodedTx): *Promise‹object›*

*Defined in [wallet-hsm-azure/src/azure-hsm-signer.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-hsm-signer.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | RLPEncodedTx |

**Returns:** *Promise‹object›*

___

###  signTypedData

▸ **signTypedData**(`typedData`: EIP712TypedData): *Promise‹object›*

*Defined in [wallet-hsm-azure/src/azure-hsm-signer.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-hsm-signer.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹object›*
