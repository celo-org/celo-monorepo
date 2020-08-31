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

\+ **new RpcSigner**(`rpc`: [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md), `account`: string, `unlockBufferSeconds`: number, `unlockTime?`: undefined | number, `unlockDuration?`: undefined | number): *[RpcSigner](_wallets_signers_rpc_signer_.rpcsigner.md)*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L52)*

Construct a new instance of the RPC signer

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`rpc` | [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md) | - | RPC caller instance |
`account` | string | - | Account address derived from the private key to be called in init |
`unlockBufferSeconds` | number | 5 | Number of seconds to shrink the unlocked duration by to account for latency and timing inconsistencies on the node |
`unlockTime?` | undefined &#124; number | - | Timestamp in seconds when the signer was last unlocked |
`unlockDuration?` | undefined &#124; number | - | Number of seconds that the signer was last unlocked for   |

**Returns:** *[RpcSigner](_wallets_signers_rpc_signer_.rpcsigner.md)*

## Methods

###  decrypt

▸ **decrypt**(`ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:149](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L149)*

**Parameters:**

Name | Type |
------ | ------ |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:107](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L107)*

**Returns:** *string*

___

###  init

▸ **init**(`privateKey`: string, `passphrase`: string): *Promise‹string›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`passphrase` | string |

**Returns:** *Promise‹string›*

___

###  isUnlocked

▸ **isUnlocked**(): *boolean*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:131](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L131)*

**Returns:** *boolean*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L99)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signRawTransaction

▸ **signRawTransaction**(`tx`: Tx): *Promise‹EncodedTransaction›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTransaction

▸ **signTransaction**(): *Promise‹object›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:95](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L95)*

**Returns:** *Promise‹object›*

___

###  unlock

▸ **unlock**(`passphrase`: string, `duration`: number): *Promise‹boolean›*

*Defined in [contractkit/src/wallets/signers/rpc-signer.ts:109](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L109)*

**Parameters:**

Name | Type |
------ | ------ |
`passphrase` | string |
`duration` | number |

**Returns:** *Promise‹boolean›*
