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

* [getNativeKey](_wallets_signers_rpc_signer_.rpcsigner.md#getnativekey)
* [init](_wallets_signers_rpc_signer_.rpcsigner.md#init)
* [isUnlocked](_wallets_signers_rpc_signer_.rpcsigner.md#isunlocked)
* [signPersonalMessage](_wallets_signers_rpc_signer_.rpcsigner.md#signpersonalmessage)
* [signTransaction](_wallets_signers_rpc_signer_.rpcsigner.md#signtransaction)
* [unlock](_wallets_signers_rpc_signer_.rpcsigner.md#unlock)

## Constructors

###  constructor

\+ **new RpcSigner**(`rpc`: [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md), `account`: string, `unlockBufferSeconds`: number, `unlockTime`: number, `unlockDuration`: number): *[RpcSigner](_wallets_signers_rpc_signer_.rpcsigner.md)*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L11)*

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

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L62)*

**Returns:** *string*

___

###  init

▸ **init**(`privateKey`: string, `passphrase`: string): *Promise‹JsonRpcResponse›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`passphrase` | string |

**Returns:** *Promise‹JsonRpcResponse›*

___

###  isUnlocked

▸ **isUnlocked**(): *boolean*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L77)*

**Returns:** *boolean*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signTransaction

▸ **signTransaction**(`_`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L37)*

**`dev`** addToV is unused because the geth JSON-RPC adds this.

**Parameters:**

Name | Type |
------ | ------ |
`_` | number |
`encodedTx` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** *Promise‹object›*

___

###  unlock

▸ **unlock**(`passphrase`: string, `duration`: number): *Promise‹void›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`passphrase` | string |
`duration` | number |

**Returns:** *Promise‹void›*
