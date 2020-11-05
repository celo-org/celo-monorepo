# Interface: UnlockableWallet

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

###  addAccount

• **addAccount**: *addInMemoryAccount | addRemoteAccount*

*Inherited from [Wallet](_wallets_wallet_.wallet.md).[addAccount](_wallets_wallet_.wallet.md#addaccount)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L28)*

___

###  computeSharedSecret

• **computeSharedSecret**: *function*

*Inherited from [ReadOnlyWallet](_wallets_wallet_.readonlywallet.md).[computeSharedSecret](_wallets_wallet_.readonlywallet.md#computesharedsecret)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L21)*

#### Type declaration:

▸ (`address`: [Address](../modules/_base_.md#address), `publicKey`: string): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |
`publicKey` | string |

___

###  decrypt

• **decrypt**: *function*

*Inherited from [ReadOnlyWallet](_wallets_wallet_.readonlywallet.md).[decrypt](_wallets_wallet_.readonlywallet.md#decrypt)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L20)*

#### Type declaration:

▸ (`address`: [Address](../modules/_base_.md#address), `ciphertext`: Buffer): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |
`ciphertext` | Buffer |

___

###  getAccounts

• **getAccounts**: *function*

*Inherited from [ReadOnlyWallet](_wallets_wallet_.readonlywallet.md).[getAccounts](_wallets_wallet_.readonlywallet.md#getaccounts)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L14)*

#### Type declaration:

▸ (): *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

• **hasAccount**: *function*

*Inherited from [ReadOnlyWallet](_wallets_wallet_.readonlywallet.md).[hasAccount](_wallets_wallet_.readonlywallet.md#hasaccount)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L16)*

#### Type declaration:

▸ (`address?`: [Address](../modules/_base_.md#address)): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_base_.md#address) |

___

###  isAccountUnlocked

• **isAccountUnlocked**: *function*

*Defined in [packages/contractkit/src/wallets/wallet.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L33)*

#### Type declaration:

▸ (`address`: string): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

___

###  removeAccount

• **removeAccount**: *function*

*Inherited from [ReadOnlyWallet](_wallets_wallet_.readonlywallet.md).[removeAccount](_wallets_wallet_.readonlywallet.md#removeaccount)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L15)*

#### Type declaration:

▸ (`address`: [Address](../modules/_base_.md#address)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Inherited from [ReadOnlyWallet](_wallets_wallet_.readonlywallet.md).[signPersonalMessage](_wallets_wallet_.readonlywallet.md#signpersonalmessage)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L19)*

#### Type declaration:

▸ (`address`: [Address](../modules/_base_.md#address), `data`: string): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |
`data` | string |

___

###  signTransaction

• **signTransaction**: *function*

*Inherited from [ReadOnlyWallet](_wallets_wallet_.readonlywallet.md).[signTransaction](_wallets_wallet_.readonlywallet.md#signtransaction)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L17)*

#### Type declaration:

▸ (`txParams`: Tx): *Promise‹EncodedTransaction›*

**Parameters:**

Name | Type |
------ | ------ |
`txParams` | Tx |

___

###  signTypedData

• **signTypedData**: *function*

*Inherited from [ReadOnlyWallet](_wallets_wallet_.readonlywallet.md).[signTypedData](_wallets_wallet_.readonlywallet.md#signtypeddata)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L18)*

#### Type declaration:

▸ (`address`: [Address](../modules/_base_.md#address), `typedData`: EIP712TypedData): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |
`typedData` | EIP712TypedData |

___

###  unlockAccount

• **unlockAccount**: *function*

*Defined in [packages/contractkit/src/wallets/wallet.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L32)*

#### Type declaration:

▸ (`address`: string, `passphrase`: string, `duration`: number): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`passphrase` | string |
`duration` | number |
