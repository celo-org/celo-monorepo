# Class: GcpHsmSigner

## Hierarchy

* **GcpHsmSigner**

## Implements

* Signer

## Index

### Constructors

* [constructor](_gcp_hsm_signer_.gcphsmsigner.md#constructor)

### Methods

* [computeSharedSecret](_gcp_hsm_signer_.gcphsmsigner.md#computesharedsecret)
* [decrypt](_gcp_hsm_signer_.gcphsmsigner.md#decrypt)
* [getNativeKey](_gcp_hsm_signer_.gcphsmsigner.md#getnativekey)
* [signPersonalMessage](_gcp_hsm_signer_.gcphsmsigner.md#signpersonalmessage)
* [signTransaction](_gcp_hsm_signer_.gcphsmsigner.md#signtransaction)
* [signTypedData](_gcp_hsm_signer_.gcphsmsigner.md#signtypeddata)

## Constructors

###  constructor

\+ **new GcpHsmSigner**(`client`: KeyManagementServiceClient, `versionName`: string, `publicKey`: BigNumber): *[GcpHsmSigner](_gcp_hsm_signer_.gcphsmsigner.md)*

*Defined in [wallet-hsm-gcp/src/gcp-hsm-signer.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-gcp/src/gcp-hsm-signer.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | KeyManagementServiceClient |
`versionName` | string |
`publicKey` | BigNumber |

**Returns:** *[GcpHsmSigner](_gcp_hsm_signer_.gcphsmsigner.md)*

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`_publicKey`: string): *Promise‹Buffer‹››*

*Defined in [wallet-hsm-gcp/src/gcp-hsm-signer.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-gcp/src/gcp-hsm-signer.ts#L111)*

**Parameters:**

Name | Type |
------ | ------ |
`_publicKey` | string |

**Returns:** *Promise‹Buffer‹››*

___

###  decrypt

▸ **decrypt**(`_ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [wallet-hsm-gcp/src/gcp-hsm-signer.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-gcp/src/gcp-hsm-signer.ts#L105)*

**Parameters:**

Name | Type |
------ | ------ |
`_ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [wallet-hsm-gcp/src/gcp-hsm-signer.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-gcp/src/gcp-hsm-signer.ts#L101)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹Signature›*

*Defined in [wallet-hsm-gcp/src/gcp-hsm-signer.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-gcp/src/gcp-hsm-signer.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹Signature›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: RLPEncodedTx): *Promise‹Signature›*

*Defined in [wallet-hsm-gcp/src/gcp-hsm-signer.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-gcp/src/gcp-hsm-signer.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | RLPEncodedTx |

**Returns:** *Promise‹Signature›*

___

###  signTypedData

▸ **signTypedData**(`typedData`: EIP712TypedData): *Promise‹Signature›*

*Defined in [wallet-hsm-gcp/src/gcp-hsm-signer.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-gcp/src/gcp-hsm-signer.ts#L90)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹Signature›*
