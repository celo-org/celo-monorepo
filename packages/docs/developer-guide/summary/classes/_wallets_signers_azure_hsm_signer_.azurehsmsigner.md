# AzureHSMSigner

Signs the EVM transaction using an HSM key in Azure Key Vault

## Hierarchy

* **AzureHSMSigner**

## Implements

* [Signer](../interfaces/_wallets_signers_signer_.signer.md)

## Index

### Constructors

* [constructor](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#constructor)

### Methods

* [computeSharedSecret](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#computesharedsecret)
* [decrypt](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#decrypt)
* [getNativeKey](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#getnativekey)
* [signPersonalMessage](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#signpersonalmessage)
* [signTransaction](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#signtransaction)
* [signTypedData](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md#signtypeddata)

## Constructors

### constructor

+ **new AzureHSMSigner**\(`keyVaultClient`: [AzureKeyVaultClient](_utils_azure_key_vault_client_.azurekeyvaultclient.md), `keyName`: string\): [_AzureHSMSigner_](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md)

_Defined in_ [_packages/contractkit/src/wallets/signers/azure-hsm-signer.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L13)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keyVaultClient` | [AzureKeyVaultClient](_utils_azure_key_vault_client_.azurekeyvaultclient.md) |
| `keyName` | string |

**Returns:** [_AzureHSMSigner_](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md)

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`_publicKey`: string\): _Promise‹Buffer‹››_

_Defined in_ [_packages/contractkit/src/wallets/signers/azure-hsm-signer.ts:81_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L81)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_publicKey` | string |

**Returns:** _Promise‹Buffer‹››_

### decrypt

▸ **decrypt**\(`_ciphertext`: Buffer\): _Promise‹Buffer‹››_

_Defined in_ [_packages/contractkit/src/wallets/signers/azure-hsm-signer.ts:75_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L75)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_ciphertext` | Buffer |

**Returns:** _Promise‹Buffer‹››_

### getNativeKey

▸ **getNativeKey**\(\): _string_

_Defined in_ [_packages/contractkit/src/wallets/signers/azure-hsm-signer.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L71)

**Returns:** _string_

### signPersonalMessage

▸ **signPersonalMessage**\(`data`: string\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wallets/signers/azure-hsm-signer.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L39)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** _Promise‹object›_

### signTransaction

▸ **signTransaction**\(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wallets/signers/azure-hsm-signer.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L23)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** _Promise‹object›_

### signTypedData

▸ **signTypedData**\(`typedData`: EIP712TypedData\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wallets/signers/azure-hsm-signer.ts:57_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L57)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | EIP712TypedData |

**Returns:** _Promise‹object›_

