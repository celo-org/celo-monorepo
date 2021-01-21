# ReadOnlyWallet

## Hierarchy

* **ReadOnlyWallet**

## Index

### Properties

* [computeSharedSecret]()
* [decrypt]()
* [getAccounts]()
* [hasAccount]()
* [removeAccount]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

## Properties

### computeSharedSecret

• **computeSharedSecret**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L12)

#### Type declaration:

▸ \(`address`: [Address](_types_.md#address), `publicKey`: string\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) |
| `publicKey` | string |

### decrypt

• **decrypt**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L11)

#### Type declaration:

▸ \(`address`: [Address](_types_.md#address), `ciphertext`: Buffer\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) |
| `ciphertext` | Buffer |

### getAccounts

• **getAccounts**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:5_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L5)

#### Type declaration:

▸ \(\): [_Address_](_types_.md#address)_\[\]_

### hasAccount

• **hasAccount**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:7_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L7)

#### Type declaration:

▸ \(`address?`: [Address](_types_.md#address)\): _boolean_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | [Address](_types_.md#address) |

### removeAccount

• **removeAccount**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:6_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L6)

#### Type declaration:

▸ \(`address`: [Address](_types_.md#address)\): _void_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) |

### signPersonalMessage

• **signPersonalMessage**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L10)

#### Type declaration:

▸ \(`address`: [Address](_types_.md#address), `data`: string\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) |
| `data` | string |

### signTransaction

• **signTransaction**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:8_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L8)

#### Type declaration:

▸ \(`txParams`: [CeloTx](_types_.md#celotx)\): _Promise‹_[_EncodedTransaction_]()_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txParams` | [CeloTx](_types_.md#celotx) |

### signTypedData

• **signTypedData**: _function_

_Defined in_ [_packages/sdk/connect/src/wallet.ts:9_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L9)

#### Type declaration:

▸ \(`address`: [Address](_types_.md#address), `typedData`: EIP712TypedData\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) |
| `typedData` | EIP712TypedData |

