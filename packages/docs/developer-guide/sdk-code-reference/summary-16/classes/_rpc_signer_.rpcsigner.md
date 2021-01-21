# RpcSigner

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

### constructor

+ **new RpcSigner**\(`rpc`: RpcCaller, `account`: string, `unlockBufferSeconds`: number, `unlockTime?`: undefined \| number, `unlockDuration?`: undefined \| number\): [_RpcSigner_](_rpc_signer_.rpcsigner.md)

_Defined in_ [_wallet-rpc/src/rpc-signer.ts:54_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L54)

Construct a new instance of the RPC signer

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `rpc` | RpcCaller | - | RPC caller instance |
| `account` | string | - | Account address derived from the private key to be called in init |
| `unlockBufferSeconds` | number | 5 | Number of seconds to shrink the unlocked duration by to account for latency and timing inconsistencies on the node |
| `unlockTime?` | undefined \| number | - | Timestamp in seconds when the signer was last unlocked |
| `unlockDuration?` | undefined \| number | - | Number of seconds that the signer was last unlocked for |

**Returns:** [_RpcSigner_](_rpc_signer_.rpcsigner.md)

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`_publicKey`: string\): _Promise‹Buffer‹››_

_Defined in_ [_wallet-rpc/src/rpc-signer.ts:169_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L169)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_publicKey` | string |

**Returns:** _Promise‹Buffer‹››_

### decrypt

▸ **decrypt**\(`ciphertext`: Buffer\): _Promise‹Buffer‹››_

_Defined in_ [_wallet-rpc/src/rpc-signer.ts:160_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L160)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `ciphertext` | Buffer |

**Returns:** _Promise‹Buffer‹››_

### getNativeKey

▸ **getNativeKey**\(\): _string_

_Defined in_ [_wallet-rpc/src/rpc-signer.ts:118_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L118)

**Returns:** _string_

### init

▸ **init**\(`privateKey`: string, `passphrase`: string\): _Promise‹string›_

_Defined in_ [_wallet-rpc/src/rpc-signer.ts:74_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L74)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |
| `passphrase` | string |

**Returns:** _Promise‹string›_

### isUnlocked

▸ **isUnlocked**\(\): _boolean_

_Defined in_ [_wallet-rpc/src/rpc-signer.ts:142_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L142)

**Returns:** _boolean_

### signPersonalMessage

▸ **signPersonalMessage**\(`data`: string\): _Promise‹object›_

_Defined in_ [_wallet-rpc/src/rpc-signer.ts:110_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L110)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** _Promise‹object›_

### signRawTransaction

▸ **signRawTransaction**\(`tx`: CeloTx\): _Promise‹EncodedTransaction›_

_Defined in_ [_wallet-rpc/src/rpc-signer.ts:80_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L80)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | CeloTx |

**Returns:** _Promise‹EncodedTransaction›_

### signTransaction

▸ **signTransaction**\(\): _Promise‹object›_

_Defined in_ [_wallet-rpc/src/rpc-signer.ts:97_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L97)

**Returns:** _Promise‹object›_

### signTypedData

▸ **signTypedData**\(`typedData`: EIP712TypedData\): _Promise‹object›_

_Defined in_ [_wallet-rpc/src/rpc-signer.ts:101_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L101)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | EIP712TypedData |

**Returns:** _Promise‹object›_

### unlock

▸ **unlock**\(`passphrase`: string, `duration`: number\): _Promise‹boolean›_

_Defined in_ [_wallet-rpc/src/rpc-signer.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-signer.ts#L120)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `passphrase` | string |
| `duration` | number |

**Returns:** _Promise‹boolean›_

