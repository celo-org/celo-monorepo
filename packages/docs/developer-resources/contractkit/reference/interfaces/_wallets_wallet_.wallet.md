# Interface: Wallet

## Hierarchy

* [ReadOnlyWallet](_wallets_wallet_.readonlywallet.md)

  ↳ **Wallet**

  ↳ [UnlockableWallet](_wallets_wallet_.unlockablewallet.md)

## Implemented by

* [LocalWallet](../classes/_wallets_local_wallet_.localwallet.md)

## Index

### Properties

* [addAccount](_wallets_wallet_.wallet.md#addaccount)
* [decrypt](_wallets_wallet_.wallet.md#decrypt)
* [getAccounts](_wallets_wallet_.wallet.md#getaccounts)
* [hasAccount](_wallets_wallet_.wallet.md#hasaccount)
* [signPersonalMessage](_wallets_wallet_.wallet.md#signpersonalmessage)
* [signTransaction](_wallets_wallet_.wallet.md#signtransaction)
* [signTypedData](_wallets_wallet_.wallet.md#signtypeddata)

## Properties

###  addAccount

• **addAccount**: *addInMemoryAccount | addRemoteAccount*

*Defined in [contractkit/src/wallets/wallet.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L26)*

___

###  decrypt

• **decrypt**: *function*

*Inherited from [ReadOnlyWallet](_wallets_wallet_.readonlywallet.md).[decrypt](_wallets_wallet_.readonlywallet.md#decrypt)*

*Defined in [contractkit/src/wallets/wallet.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L19)*

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

*Defined in [contractkit/src/wallets/wallet.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L14)*

#### Type declaration:

▸ (): *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

• **hasAccount**: *function*

*Inherited from [ReadOnlyWallet](_wallets_wallet_.readonlywallet.md).[hasAccount](_wallets_wallet_.readonlywallet.md#hasaccount)*

*Defined in [contractkit/src/wallets/wallet.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L15)*

#### Type declaration:

▸ (`address?`: [Address](../modules/_base_.md#address)): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_base_.md#address) |

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Inherited from [ReadOnlyWallet](_wallets_wallet_.readonlywallet.md).[signPersonalMessage](_wallets_wallet_.readonlywallet.md#signpersonalmessage)*

*Defined in [contractkit/src/wallets/wallet.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L18)*

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

*Defined in [contractkit/src/wallets/wallet.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L16)*

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

*Defined in [contractkit/src/wallets/wallet.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L17)*

#### Type declaration:

▸ (`address`: [Address](../modules/_base_.md#address), `typedData`: EIP712TypedData): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |
`typedData` | EIP712TypedData |
