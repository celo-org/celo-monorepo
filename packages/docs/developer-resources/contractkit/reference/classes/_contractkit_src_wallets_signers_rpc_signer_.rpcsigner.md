# Class: RpcSigner

Implements the signer interface on top of the JSON-RPC interface.

## Hierarchy

* **RpcSigner**

## Implements

* [Signer](../interfaces/_contractkit_src_wallets_signers_signer_.signer.md)

## Index

### Constructors

* [constructor](_contractkit_src_wallets_signers_rpc_signer_.rpcsigner.md#constructor)

### Methods

* [getNativeKey](_contractkit_src_wallets_signers_rpc_signer_.rpcsigner.md#getnativekey)
* [init](_contractkit_src_wallets_signers_rpc_signer_.rpcsigner.md#init)
* [isUnlocked](_contractkit_src_wallets_signers_rpc_signer_.rpcsigner.md#isunlocked)
* [signPersonalMessage](_contractkit_src_wallets_signers_rpc_signer_.rpcsigner.md#signpersonalmessage)
* [signRawTransaction](_contractkit_src_wallets_signers_rpc_signer_.rpcsigner.md#signrawtransaction)
* [signTransaction](_contractkit_src_wallets_signers_rpc_signer_.rpcsigner.md#signtransaction)
* [unlock](_contractkit_src_wallets_signers_rpc_signer_.rpcsigner.md#unlock)

## Constructors

###  constructor

\+ **new RpcSigner**(`rpc`: [RpcCaller](../interfaces/_contractkit_src_utils_rpc_caller_.rpccaller.md), `account`: string, `unlockBufferSeconds`: number, `unlockTime`: number, `unlockDuration`: number): *[RpcSigner](_contractkit_src_wallets_signers_rpc_signer_.rpcsigner.md)*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L50)*

Construct a new instance of the RPC signer

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`rpc` | [RpcCaller](../interfaces/_contractkit_src_utils_rpc_caller_.rpccaller.md) | - | RPC caller instance |
`account` | string | - | Account address derived from the private key to be called in init |
`unlockBufferSeconds` | number | 5 | Number of seconds to shrink the unlocked duration by to account for latency and timing inconsistencies on the node |
`unlockTime` | number | -1 | Timestamp in seconds when the signer was last unlocked |
`unlockDuration` | number | -1 | Number of seconds that the signer was last unlocked for   |

**Returns:** *[RpcSigner](_contractkit_src_wallets_signers_rpc_signer_.rpcsigner.md)*

## Methods

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L105)*

**Returns:** *string*

___

###  init

▸ **init**(`privateKey`: string, `passphrase`: string): *Promise‹string›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`passphrase` | string |

**Returns:** *Promise‹string›*

___

###  isUnlocked

▸ **isUnlocked**(): *boolean*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:129](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L129)*

**Returns:** *boolean*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L97)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signRawTransaction

▸ **signRawTransaction**(`tx`: Tx): *Promise‹EncodedTransaction›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:76](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L76)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTransaction

▸ **signTransaction**(): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L93)*

**Returns:** *Promise‹object›*

___

###  unlock

▸ **unlock**(`passphrase`: string, `duration`: number): *Promise‹boolean›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:107](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L107)*

**Parameters:**

Name | Type |
------ | ------ |
`passphrase` | string |
`duration` | number |

**Returns:** *Promise‹boolean›*
