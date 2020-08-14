# Interface: WritableWallet

## Hierarchy

* [Wallet](_contractkit_src_wallets_wallet_.wallet.md)

  ↳ **WritableWallet**

## Implemented by

* [RpcWallet](../classes/_contractkit_src_wallets_rpc_wallet_.rpcwallet.md)

## Index

### Properties

* [addAccount](_contractkit_src_wallets_wallet_.writablewallet.md#addaccount)
* [decrypt](_contractkit_src_wallets_wallet_.writablewallet.md#decrypt)
* [getAccounts](_contractkit_src_wallets_wallet_.writablewallet.md#getaccounts)
* [hasAccount](_contractkit_src_wallets_wallet_.writablewallet.md#hasaccount)
* [isAccountUnlocked](_contractkit_src_wallets_wallet_.writablewallet.md#isaccountunlocked)
* [signPersonalMessage](_contractkit_src_wallets_wallet_.writablewallet.md#signpersonalmessage)
* [signTransaction](_contractkit_src_wallets_wallet_.writablewallet.md#signtransaction)
* [signTypedData](_contractkit_src_wallets_wallet_.writablewallet.md#signtypeddata)
* [unlockAccount](_contractkit_src_wallets_wallet_.writablewallet.md#unlockaccount)

## Properties

###  addAccount

• **addAccount**: *function*

*Defined in [contractkit/src/wallets/wallet.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L25)*

#### Type declaration:

▸ (`privateKey`: string, `passphrase`: string): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`passphrase` | string |

___

###  decrypt

• **decrypt**: *function*

*Inherited from [Wallet](_contractkit_src_wallets_wallet_.wallet.md).[decrypt](_contractkit_src_wallets_wallet_.wallet.md#decrypt)*

*Defined in [contractkit/src/wallets/wallet.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L19)*

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

*Inherited from [Wallet](_contractkit_src_wallets_wallet_.wallet.md).[getAccounts](_contractkit_src_wallets_wallet_.wallet.md#getaccounts)*

*Defined in [contractkit/src/wallets/wallet.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L14)*

#### Type declaration:

▸ (): *[Address](../modules/_contractkit_src_base_.md#address)[]*

___

###  hasAccount

• **hasAccount**: *function*

*Inherited from [Wallet](_contractkit_src_wallets_wallet_.wallet.md).[hasAccount](_contractkit_src_wallets_wallet_.wallet.md#hasaccount)*

*Defined in [contractkit/src/wallets/wallet.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L15)*

#### Type declaration:

▸ (`address?`: [Address](../modules/_contractkit_src_base_.md#address)): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  isAccountUnlocked

• **isAccountUnlocked**: *function*

*Defined in [contractkit/src/wallets/wallet.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L23)*

#### Type declaration:

▸ (`address`: string): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Inherited from [Wallet](_contractkit_src_wallets_wallet_.wallet.md).[signPersonalMessage](_contractkit_src_wallets_wallet_.wallet.md#signpersonalmessage)*

*Defined in [contractkit/src/wallets/wallet.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L18)*

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

*Inherited from [Wallet](_contractkit_src_wallets_wallet_.wallet.md).[signTransaction](_contractkit_src_wallets_wallet_.wallet.md#signtransaction)*

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

*Inherited from [Wallet](_contractkit_src_wallets_wallet_.wallet.md).[signTypedData](_contractkit_src_wallets_wallet_.wallet.md#signtypeddata)*

*Defined in [contractkit/src/wallets/wallet.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L17)*

#### Type declaration:

▸ (`address`: [Address](../modules/_contractkit_src_base_.md#address), `typedData`: EIP712TypedData): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |
`typedData` | EIP712TypedData |

___

###  unlockAccount

• **unlockAccount**: *function*

*Defined in [contractkit/src/wallets/wallet.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L24)*

#### Type declaration:

▸ (`address`: string, `passphrase`: string, `duration`: number): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`passphrase` | string |
`duration` | number |
