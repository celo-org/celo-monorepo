# UnlockableWallet

## Hierarchy

↳ [Wallet](_wallets_wallet_.wallet.md)

↳ **UnlockableWallet**

## Implemented by

* [RpcWallet](../classes/_wallets_rpc_wallet_.rpcwallet.md)

## Index

### Properties

* [addAccount](_wallets_wallet_.unlockablewallet.md#addaccount)
* [computeSharedSecret](_wallets_wallet_.unlockablewallet.md#computesharedsecret)
* [decrypt](_wallets_wallet_.unlockablewallet.md#decrypt)
* [getAccounts](_wallets_wallet_.unlockablewallet.md#getaccounts)
* [hasAccount](_wallets_wallet_.unlockablewallet.md#hasaccount)
* [isAccountUnlocked](_wallets_wallet_.unlockablewallet.md#isaccountunlocked)
* [removeAccount](_wallets_wallet_.unlockablewallet.md#removeaccount)
* [signPersonalMessage](_wallets_wallet_.unlockablewallet.md#signpersonalmessage)
* [signTransaction](_wallets_wallet_.unlockablewallet.md#signtransaction)
* [signTypedData](_wallets_wallet_.unlockablewallet.md#signtypeddata)
* [unlockAccount](_wallets_wallet_.unlockablewallet.md#unlockaccount)

## Properties

### addAccount

• **addAccount**: _addInMemoryAccount \| addRemoteAccount_

_Inherited from_ [_Wallet_](_wallets_wallet_.wallet.md)_._[_addAccount_](_wallets_wallet_.wallet.md#addaccount)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L28)

### computeSharedSecret

• **computeSharedSecret**: _function_

_Inherited from_ [_ReadOnlyWallet_](_wallets_wallet_.readonlywallet.md)_._[_computeSharedSecret_](_wallets_wallet_.readonlywallet.md#computesharedsecret)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L21)

#### Type declaration:

▸ \(`address`: [Address](../modules/_base_.md#address), `publicKey`: string\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) |
| `publicKey` | string |

### decrypt

• **decrypt**: _function_

_Inherited from_ [_ReadOnlyWallet_](_wallets_wallet_.readonlywallet.md)_._[_decrypt_](_wallets_wallet_.readonlywallet.md#decrypt)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L20)

#### Type declaration:

▸ \(`address`: [Address](../modules/_base_.md#address), `ciphertext`: Buffer\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) |
| `ciphertext` | Buffer |

### getAccounts

• **getAccounts**: _function_

_Inherited from_ [_ReadOnlyWallet_](_wallets_wallet_.readonlywallet.md)_._[_getAccounts_](_wallets_wallet_.readonlywallet.md#getaccounts)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L14)

#### Type declaration:

▸ \(\): [_Address_](../modules/_base_.md#address)_\[\]_

### hasAccount

• **hasAccount**: _function_

_Inherited from_ [_ReadOnlyWallet_](_wallets_wallet_.readonlywallet.md)_._[_hasAccount_](_wallets_wallet_.readonlywallet.md#hasaccount)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L16)

#### Type declaration:

▸ \(`address?`: [Address](../modules/_base_.md#address)\): _boolean_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | [Address](../modules/_base_.md#address) |

### isAccountUnlocked

• **isAccountUnlocked**: _function_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L33)

#### Type declaration:

▸ \(`address`: string\): _boolean_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

### removeAccount

• **removeAccount**: _function_

_Inherited from_ [_ReadOnlyWallet_](_wallets_wallet_.readonlywallet.md)_._[_removeAccount_](_wallets_wallet_.readonlywallet.md#removeaccount)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L15)

#### Type declaration:

▸ \(`address`: [Address](../modules/_base_.md#address)\): _void_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) |

### signPersonalMessage

• **signPersonalMessage**: _function_

_Inherited from_ [_ReadOnlyWallet_](_wallets_wallet_.readonlywallet.md)_._[_signPersonalMessage_](_wallets_wallet_.readonlywallet.md#signpersonalmessage)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L19)

#### Type declaration:

▸ \(`address`: [Address](../modules/_base_.md#address), `data`: string\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) |
| `data` | string |

### signTransaction

• **signTransaction**: _function_

_Inherited from_ [_ReadOnlyWallet_](_wallets_wallet_.readonlywallet.md)_._[_signTransaction_](_wallets_wallet_.readonlywallet.md#signtransaction)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L17)

#### Type declaration:

▸ \(`txParams`: Tx\): _Promise‹EncodedTransaction›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txParams` | Tx |

### signTypedData

• **signTypedData**: _function_

_Inherited from_ [_ReadOnlyWallet_](_wallets_wallet_.readonlywallet.md)_._[_signTypedData_](_wallets_wallet_.readonlywallet.md#signtypeddata)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L18)

#### Type declaration:

▸ \(`address`: [Address](../modules/_base_.md#address), `typedData`: EIP712TypedData\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) |
| `typedData` | EIP712TypedData |

### unlockAccount

• **unlockAccount**: _function_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L32)

#### Type declaration:

▸ \(`address`: string, `passphrase`: string, `duration`: number\): _Promise‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `passphrase` | string |
| `duration` | number |

