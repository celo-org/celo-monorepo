# Interface: UnlockableWallet

## Hierarchy

  ↳ [Wallet](_wallet_base_.wallet.md)

  ↳ **UnlockableWallet**

## Index

### Properties

* [addAccount](_wallet_base_.unlockablewallet.md#addaccount)
* [computeSharedSecret](_wallet_base_.unlockablewallet.md#computesharedsecret)
* [decrypt](_wallet_base_.unlockablewallet.md#decrypt)
* [getAccounts](_wallet_base_.unlockablewallet.md#getaccounts)
* [hasAccount](_wallet_base_.unlockablewallet.md#hasaccount)
* [isAccountUnlocked](_wallet_base_.unlockablewallet.md#isaccountunlocked)
* [removeAccount](_wallet_base_.unlockablewallet.md#removeaccount)
* [signPersonalMessage](_wallet_base_.unlockablewallet.md#signpersonalmessage)
* [signTransaction](_wallet_base_.unlockablewallet.md#signtransaction)
* [signTypedData](_wallet_base_.unlockablewallet.md#signtypeddata)
* [unlockAccount](_wallet_base_.unlockablewallet.md#unlockaccount)

## Properties

###  addAccount

• **addAccount**: *addInMemoryAccount | addRemoteAccount*

*Inherited from [Wallet](_wallet_base_.wallet.md).[addAccount](_wallet_base_.wallet.md#addaccount)*

*Defined in [wallets/wallet-base/src/wallet-base.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/wallet-base.ts#L11)*

___

###  computeSharedSecret

• **computeSharedSecret**: *function*

*Inherited from [Wallet](_wallet_base_.wallet.md).[computeSharedSecret](_wallet_base_.wallet.md#computesharedsecret)*

Defined in connect/lib/wallet.d.ts:12

#### Type declaration:

▸ (`address`: Address, `publicKey`: string): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |
`publicKey` | string |

___

###  decrypt

• **decrypt**: *function*

*Inherited from [Wallet](_wallet_base_.wallet.md).[decrypt](_wallet_base_.wallet.md#decrypt)*

Defined in connect/lib/wallet.d.ts:11

#### Type declaration:

▸ (`address`: Address, `ciphertext`: Buffer): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |
`ciphertext` | Buffer |

___

###  getAccounts

• **getAccounts**: *function*

*Inherited from [Wallet](_wallet_base_.wallet.md).[getAccounts](_wallet_base_.wallet.md#getaccounts)*

Defined in connect/lib/wallet.d.ts:5

#### Type declaration:

▸ (): *Address[]*

___

###  hasAccount

• **hasAccount**: *function*

*Inherited from [Wallet](_wallet_base_.wallet.md).[hasAccount](_wallet_base_.wallet.md#hasaccount)*

Defined in connect/lib/wallet.d.ts:7

#### Type declaration:

▸ (`address?`: Address): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | Address |

___

###  isAccountUnlocked

• **isAccountUnlocked**: *function*

*Defined in [wallets/wallet-base/src/wallet-base.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/wallet-base.ts#L16)*

#### Type declaration:

▸ (`address`: string): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

___

###  removeAccount

• **removeAccount**: *function*

*Inherited from [Wallet](_wallet_base_.wallet.md).[removeAccount](_wallet_base_.wallet.md#removeaccount)*

Defined in connect/lib/wallet.d.ts:6

#### Type declaration:

▸ (`address`: Address): *void*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Inherited from [Wallet](_wallet_base_.wallet.md).[signPersonalMessage](_wallet_base_.wallet.md#signpersonalmessage)*

Defined in connect/lib/wallet.d.ts:10

#### Type declaration:

▸ (`address`: Address, `data`: string): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |
`data` | string |

___

###  signTransaction

• **signTransaction**: *function*

*Inherited from [Wallet](_wallet_base_.wallet.md).[signTransaction](_wallet_base_.wallet.md#signtransaction)*

Defined in connect/lib/wallet.d.ts:8

#### Type declaration:

▸ (`txParams`: CeloTx): *Promise‹EncodedTransaction›*

**Parameters:**

Name | Type |
------ | ------ |
`txParams` | CeloTx |

___

###  signTypedData

• **signTypedData**: *function*

*Inherited from [Wallet](_wallet_base_.wallet.md).[signTypedData](_wallet_base_.wallet.md#signtypeddata)*

Defined in connect/lib/wallet.d.ts:9

#### Type declaration:

▸ (`address`: Address, `typedData`: EIP712TypedData): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |
`typedData` | EIP712TypedData |

___

###  unlockAccount

• **unlockAccount**: *function*

*Defined in [wallets/wallet-base/src/wallet-base.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/wallet-base.ts#L15)*

#### Type declaration:

▸ (`address`: string, `passphrase`: string, `duration`: number): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`passphrase` | string |
`duration` | number |
