# RpcSigner

Implements the signer interface on top of the JSON-RPC interface.

## Hierarchy

* **RpcSigner**

## Implements

* [Signer]()

## Index

### Constructors

* [constructor]()

### Methods

* [computeSharedSecret]()
* [decrypt]()
* [getNativeKey]()
* [init]()
* [isUnlocked]()
* [signPersonalMessage]()
* [signRawTransaction]()
* [signTransaction]()
* [signTypedData]()
* [unlock]()

## Constructors

### constructor

+ **new RpcSigner**\(`rpc`: [RpcCaller](), `account`: string, `unlockBufferSeconds`: number, `unlockTime?`: undefined \| number, `unlockDuration?`: undefined \| number\): [_RpcSigner_]()

_Defined in_ [_packages/contractkit/src/wallets/signers/rpc-signer.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L56)

Construct a new instance of the RPC signer

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `rpc` | [RpcCaller]() | - | RPC caller instance |
| `account` | string | - | Account address derived from the private key to be called in init |
| `unlockBufferSeconds` | number | 5 | Number of seconds to shrink the unlocked duration by to account for latency and timing inconsistencies on the node |
| `unlockTime?` | undefined \| number | - | Timestamp in seconds when the signer was last unlocked |
| `unlockDuration?` | undefined \| number | - | Number of seconds that the signer was last unlocked for |

**Returns:** [_RpcSigner_]()

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`_publicKey`: string\): _Promise‹Buffer‹››_

_Defined in_ [_packages/contractkit/src/wallets/signers/rpc-signer.ts:171_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L171)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_publicKey` | string |

**Returns:** _Promise‹Buffer‹››_

### decrypt

▸ **decrypt**\(`ciphertext`: Buffer\): _Promise‹Buffer‹››_

_Defined in_ [_packages/contractkit/src/wallets/signers/rpc-signer.ts:162_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L162)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `ciphertext` | Buffer |

**Returns:** _Promise‹Buffer‹››_

### getNativeKey

▸ **getNativeKey**\(\): _string_

_Defined in_ [_packages/contractkit/src/wallets/signers/rpc-signer.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L120)

**Returns:** _string_

### init

▸ **init**\(`privateKey`: string, `passphrase`: string\): _Promise‹string›_

_Defined in_ [_packages/contractkit/src/wallets/signers/rpc-signer.ts:76_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L76)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |
| `passphrase` | string |

**Returns:** _Promise‹string›_

### isUnlocked

▸ **isUnlocked**\(\): _boolean_

_Defined in_ [_packages/contractkit/src/wallets/signers/rpc-signer.ts:144_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L144)

**Returns:** _boolean_

### signPersonalMessage

▸ **signPersonalMessage**\(`data`: string\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wallets/signers/rpc-signer.ts:112_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L112)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** _Promise‹object›_

### signRawTransaction

▸ **signRawTransaction**\(`tx`: Tx\): _Promise‹EncodedTransaction›_

_Defined in_ [_packages/contractkit/src/wallets/signers/rpc-signer.ts:82_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L82)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | Tx |

**Returns:** _Promise‹EncodedTransaction›_

### signTransaction

▸ **signTransaction**\(\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wallets/signers/rpc-signer.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L99)

**Returns:** _Promise‹object›_

### signTypedData

▸ **signTypedData**\(`typedData`: EIP712TypedData\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wallets/signers/rpc-signer.ts:103_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L103)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | EIP712TypedData |

**Returns:** _Promise‹object›_

### unlock

▸ **unlock**\(`passphrase`: string, `duration`: number\): _Promise‹boolean›_

_Defined in_ [_packages/contractkit/src/wallets/signers/rpc-signer.ts:122_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/rpc-signer.ts#L122)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `passphrase` | string |
| `duration` | number |

**Returns:** _Promise‹boolean›_

