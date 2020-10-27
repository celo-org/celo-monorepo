# Interface: Wallet

## Hierarchy

* [ReadOnlyWallet](_contractkit_src_wallets_wallet_.readonlywallet.md)

  ↳ **Wallet**

  ↳ [UnlockableWallet](_contractkit_src_wallets_wallet_.unlockablewallet.md)

## Implemented by

* [LocalWallet](../classes/_contractkit_src_wallets_local_wallet_.localwallet.md)

## Index

### Properties

* [addAccount](_contractkit_src_wallets_wallet_.wallet.md#addaccount)
* [computeSharedSecret](_contractkit_src_wallets_wallet_.wallet.md#computesharedsecret)
* [decrypt](_contractkit_src_wallets_wallet_.wallet.md#decrypt)
* [getAccounts](_contractkit_src_wallets_wallet_.wallet.md#getaccounts)
* [hasAccount](_contractkit_src_wallets_wallet_.wallet.md#hasaccount)
* [removeAccount](_contractkit_src_wallets_wallet_.wallet.md#removeaccount)
* [signPersonalMessage](_contractkit_src_wallets_wallet_.wallet.md#signpersonalmessage)
* [signTransaction](_contractkit_src_wallets_wallet_.wallet.md#signtransaction)
* [signTypedData](_contractkit_src_wallets_wallet_.wallet.md#signtypeddata)

## Properties

###  addAccount

• **addAccount**: *addInMemoryAccount | addRemoteAccount*

*Defined in [packages/contractkit/src/wallets/wallet.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L28)*

___

###  computeSharedSecret

• **computeSharedSecret**: *function*

*Inherited from [ReadOnlyWallet](_contractkit_src_wallets_wallet_.readonlywallet.md).[computeSharedSecret](_contractkit_src_wallets_wallet_.readonlywallet.md#computesharedsecret)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L21)*

#### Type declaration:

▸ (`address`: [Address](../modules/_contractkit_src_base_.md#address), `publicKey`: string): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |
`publicKey` | string |

___

###  decrypt

• **decrypt**: *function*

*Inherited from [ReadOnlyWallet](_contractkit_src_wallets_wallet_.readonlywallet.md).[decrypt](_contractkit_src_wallets_wallet_.readonlywallet.md#decrypt)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L20)*

#### Type declaration:

▸ (`address`: [Address](../modules/_contractkit_src_base_.md#address), `ciphertext`: Buffer): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |
`ciphertext` | Buffer |

___

###  getAccounts

• **getAccounts**: *function*

*Inherited from [ReadOnlyWallet](_contractkit_src_wallets_wallet_.readonlywallet.md).[getAccounts](_contractkit_src_wallets_wallet_.readonlywallet.md#getaccounts)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L14)*

#### Type declaration:

▸ (): *[Address](../modules/_contractkit_src_base_.md#address)[]*

___

###  hasAccount

• **hasAccount**: *function*

*Inherited from [ReadOnlyWallet](_contractkit_src_wallets_wallet_.readonlywallet.md).[hasAccount](_contractkit_src_wallets_wallet_.readonlywallet.md#hasaccount)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L16)*

#### Type declaration:

▸ (`address?`: [Address](../modules/_contractkit_src_base_.md#address)): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  removeAccount

• **removeAccount**: *function*

*Inherited from [ReadOnlyWallet](_contractkit_src_wallets_wallet_.readonlywallet.md).[removeAccount](_contractkit_src_wallets_wallet_.readonlywallet.md#removeaccount)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L15)*

#### Type declaration:

▸ (`address`: [Address](../modules/_contractkit_src_base_.md#address)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Inherited from [ReadOnlyWallet](_contractkit_src_wallets_wallet_.readonlywallet.md).[signPersonalMessage](_contractkit_src_wallets_wallet_.readonlywallet.md#signpersonalmessage)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L19)*

#### Type declaration:

▸ (`address`: [Address](../modules/_contractkit_src_base_.md#address), `data`: string): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |
`data` | string |

___

###  signTransaction

• **signTransaction**: *function*

*Inherited from [ReadOnlyWallet](_contractkit_src_wallets_wallet_.readonlywallet.md).[signTransaction](_contractkit_src_wallets_wallet_.readonlywallet.md#signtransaction)*

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

*Inherited from [ReadOnlyWallet](_contractkit_src_wallets_wallet_.readonlywallet.md).[signTypedData](_contractkit_src_wallets_wallet_.readonlywallet.md#signtypeddata)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L18)*

#### Type declaration:

▸ (`address`: [Address](../modules/_contractkit_src_base_.md#address), `typedData`: EIP712TypedData): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |
`typedData` | EIP712TypedData |
