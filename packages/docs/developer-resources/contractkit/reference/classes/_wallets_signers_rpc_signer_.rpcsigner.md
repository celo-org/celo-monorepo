# Class: RpcSigner

Implements the signer interface on top of the JSON-RPC interface.

## Hierarchy

* **RpcSigner**

## Implements

* [Signer](../interfaces/_wallets_signers_signer_.signer.md)

## Index

### Constructors

* [constructor](_wallets_signers_rpc_signer_.rpcsigner.md#constructor)

### Methods

* [decrypt](_wallets_signers_rpc_signer_.rpcsigner.md#decrypt)
* [getNativeKey](_wallets_signers_rpc_signer_.rpcsigner.md#getnativekey)
* [init](_wallets_signers_rpc_signer_.rpcsigner.md#init)
* [isUnlocked](_wallets_signers_rpc_signer_.rpcsigner.md#isunlocked)
* [signPersonalMessage](_wallets_signers_rpc_signer_.rpcsigner.md#signpersonalmessage)
* [signRawTransaction](_wallets_signers_rpc_signer_.rpcsigner.md#signrawtransaction)
* [signTransaction](_wallets_signers_rpc_signer_.rpcsigner.md#signtransaction)
* [unlock](_wallets_signers_rpc_signer_.rpcsigner.md#unlock)

## Constructors

###  constructor

\+ **new RpcSigner**(`rpc`: [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md), `account`: string, `unlockBufferSeconds`: number, `unlockTime`: number, `unlockDuration`: number): *[RpcSigner](_wallets_signers_rpc_signer_.rpcsigner.md)*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L53)*

Construct a new instance of the RPC signer

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`rpc` | [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md) | - | RPC caller instance |
`account` | string | - | Account address derived from the private key to be called in init |
`unlockBufferSeconds` | number | 5 | Number of seconds to shrink the unlocked duration by to account for latency and timing inconsistencies on the node |
`unlockTime` | number | -1 | Timestamp in seconds when the signer was last unlocked |
`unlockDuration` | number | -1 | Number of seconds that the signer was last unlocked for   |

**Returns:** *[RpcSigner](_wallets_signers_rpc_signer_.rpcsigner.md)*

## Methods

###  decrypt

▸ **decrypt**(`ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L147)*

**Parameters:**

Name | Type |
------ | ------ |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:108](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L108)*

**Returns:** *string*

___

###  init

▸ **init**(`privateKey`: string, `passphrase`: string): *Promise‹string›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`passphrase` | string |

**Returns:** *Promise‹string›*

___

###  isUnlocked

▸ **isUnlocked**(): *boolean*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:132](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L132)*

**Returns:** *boolean*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signRawTransaction

▸ **signRawTransaction**(`tx`: Tx): *Promise‹EncodedTransaction›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L79)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTransaction

▸ **signTransaction**(): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:96](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L96)*

**Returns:** *Promise‹object›*

___

###  unlock

▸ **unlock**(`passphrase`: string, `duration`: number): *Promise‹boolean›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L110)*

**Parameters:**

Name | Type |
------ | ------ |
`passphrase` | string |
`duration` | number |

**Returns:** *Promise‹boolean›*
