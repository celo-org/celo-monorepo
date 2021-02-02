# Class: RpcSigner

Implements the signer interface on top of the JSON-RPC interface.

## Hierarchy

* **RpcSigner**

## Implements

* Signer

## Index

### Constructors

* [constructor](_rpc_signer_.rpcsigner.md#constructor)

### Methods

* [computeSharedSecret](_rpc_signer_.rpcsigner.md#computesharedsecret)
* [decrypt](_rpc_signer_.rpcsigner.md#decrypt)
* [getNativeKey](_rpc_signer_.rpcsigner.md#getnativekey)
* [init](_rpc_signer_.rpcsigner.md#init)
* [isUnlocked](_rpc_signer_.rpcsigner.md#isunlocked)
* [signPersonalMessage](_rpc_signer_.rpcsigner.md#signpersonalmessage)
* [signRawTransaction](_rpc_signer_.rpcsigner.md#signrawtransaction)
* [signTransaction](_rpc_signer_.rpcsigner.md#signtransaction)
* [signTypedData](_rpc_signer_.rpcsigner.md#signtypeddata)
* [unlock](_rpc_signer_.rpcsigner.md#unlock)

## Constructors

###  constructor

\+ **new RpcSigner**(`rpc`: RpcCaller, `account`: string, `unlockBufferSeconds`: number, `unlockTime?`: undefined | number, `unlockDuration?`: undefined | number): *[RpcSigner](_rpc_signer_.rpcsigner.md)*

*Defined in [wallet-rpc/src/rpc-signer.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L54)*

Construct a new instance of the RPC signer

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`rpc` | RpcCaller | - | RPC caller instance |
`account` | string | - | Account address derived from the private key to be called in init |
`unlockBufferSeconds` | number | 5 | Number of seconds to shrink the unlocked duration by to account for latency and timing inconsistencies on the node |
`unlockTime?` | undefined &#124; number | - | Timestamp in seconds when the signer was last unlocked |
`unlockDuration?` | undefined &#124; number | - | Number of seconds that the signer was last unlocked for   |

**Returns:** *[RpcSigner](_rpc_signer_.rpcsigner.md)*

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`_publicKey`: string): *Promise‹Buffer‹››*

*Defined in [wallet-rpc/src/rpc-signer.ts:169](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L169)*

**Parameters:**

Name | Type |
------ | ------ |
`_publicKey` | string |

**Returns:** *Promise‹Buffer‹››*

___

###  decrypt

▸ **decrypt**(`ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [wallet-rpc/src/rpc-signer.ts:160](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L160)*

**Parameters:**

Name | Type |
------ | ------ |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [wallet-rpc/src/rpc-signer.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L118)*

**Returns:** *string*

___

###  init

▸ **init**(`privateKey`: string, `passphrase`: string): *Promise‹string›*

*Defined in [wallet-rpc/src/rpc-signer.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`passphrase` | string |

**Returns:** *Promise‹string›*

___

###  isUnlocked

▸ **isUnlocked**(): *boolean*

*Defined in [wallet-rpc/src/rpc-signer.ts:142](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L142)*

**Returns:** *boolean*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [wallet-rpc/src/rpc-signer.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L110)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signRawTransaction

▸ **signRawTransaction**(`tx`: CeloTx): *Promise‹EncodedTransaction›*

*Defined in [wallet-rpc/src/rpc-signer.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L80)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTx |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTransaction

▸ **signTransaction**(): *Promise‹object›*

*Defined in [wallet-rpc/src/rpc-signer.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L97)*

**Returns:** *Promise‹object›*

___

###  signTypedData

▸ **signTypedData**(`typedData`: EIP712TypedData): *Promise‹object›*

*Defined in [wallet-rpc/src/rpc-signer.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹object›*

___

###  unlock

▸ **unlock**(`passphrase`: string, `duration`: number): *Promise‹boolean›*

*Defined in [wallet-rpc/src/rpc-signer.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`passphrase` | string |
`duration` | number |

**Returns:** *Promise‹boolean›*
