# AzureHSMSigner

Signs the EVM transaction using an HSM key in Azure Key Vault

## Hierarchy

* **AzureHSMSigner**

## Implements

* [Signer]()

## Index

### Constructors

* [constructor]()

### Methods

* [getNativeKey]()
* [signPersonalMessage]()
* [signTransaction]()

## Constructors

### constructor

+ **new AzureHSMSigner**\(`keyVaultClient`: [AzureKeyVaultClient](), `keyName`: string\): [_AzureHSMSigner_]()

_Defined in_ [_contractkit/src/wallets/signers/azure-hsm-signer.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L12)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keyVaultClient` | [AzureKeyVaultClient]() |
| `keyName` | string |

**Returns:** [_AzureHSMSigner_]()

## Methods

### getNativeKey

▸ **getNativeKey**\(\): _string_

_Defined in_ [_contractkit/src/wallets/signers/azure-hsm-signer.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L56)

**Returns:** _string_

### signPersonalMessage

▸ **signPersonalMessage**\(`data`: string\): _Promise‹object›_

_Defined in_ [_contractkit/src/wallets/signers/azure-hsm-signer.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L38)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** _Promise‹object›_

### signTransaction

▸ **signTransaction**\(`addToV`: number, `encodedTx`: [RLPEncodedTx]()\): _Promise‹object›_

_Defined in_ [_contractkit/src/wallets/signers/azure-hsm-signer.ts:22_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/azure-hsm-signer.ts#L22)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | [RLPEncodedTx]() |

**Returns:** _Promise‹object›_

