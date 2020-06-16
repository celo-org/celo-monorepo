# Class: AzureHSMSigner

Signs the EVM transaction using an HSM key in Azure Key Vault

## Hierarchy

* **AzureHSMSigner**

## Implements

* [Signer](../interfaces/_wallets_signers_signer_.signer.md)

## Index

### Constructors

* [constructor](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#constructor)

### Methods

* [getNativeKey](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#getnativekey)
* [signPersonalMessage](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#signpersonalmessage)
* [signTransaction](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#signtransaction)

## Constructors

###  constructor

\+ **new AzureHSMSigner**(`keyVaultClient`: [AzureKeyVaultClient](_utils_azure_key_vault_client_.azurekeyvaultclient.md), `keyName`: string): *[AzureHSMSigner](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md)*

*Defined in [contractkit/src/wallets/signers/azure-hsm-signer.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`keyVaultClient` | [AzureKeyVaultClient](_utils_azure_key_vault_client_.azurekeyvaultclient.md) |
`keyName` | string |

**Returns:** *[AzureHSMSigner](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md)*

## Methods

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [contractkit/src/wallets/signers/azure-hsm-signer.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L56)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/azure-hsm-signer.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/azure-hsm-signer.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** *Promise‹object›*
