[@celo/connect](../README.md) › [Globals](../globals.md) › ["wallet"](../modules/_wallet_.md) › [ReadOnlyWallet](_wallet_.readonlywallet.md)

# Interface: ReadOnlyWallet

## Hierarchy

* **ReadOnlyWallet**

## Index

### Properties

* [computeSharedSecret](_wallet_.readonlywallet.md#computesharedsecret)
* [decrypt](_wallet_.readonlywallet.md#decrypt)
* [getAccounts](_wallet_.readonlywallet.md#getaccounts)
* [hasAccount](_wallet_.readonlywallet.md#hasaccount)
* [removeAccount](_wallet_.readonlywallet.md#removeaccount)
* [signPersonalMessage](_wallet_.readonlywallet.md#signpersonalmessage)
* [signTransaction](_wallet_.readonlywallet.md#signtransaction)
* [signTypedData](_wallet_.readonlywallet.md#signtypeddata)

## Properties

###  computeSharedSecret

• **computeSharedSecret**: *function*

*Defined in [wallet.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L12)*

#### Type declaration:

▸ (`address`: [Address](../modules/_types_.md#address), `publicKey`: string): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |
`publicKey` | string |

___

###  decrypt

• **decrypt**: *function*

*Defined in [wallet.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L11)*

#### Type declaration:

▸ (`address`: [Address](../modules/_types_.md#address), `ciphertext`: Buffer): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |
`ciphertext` | Buffer |

___

###  getAccounts

• **getAccounts**: *function*

*Defined in [wallet.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L5)*

#### Type declaration:

▸ (): *[Address](../modules/_types_.md#address)[]*

___

###  hasAccount

• **hasAccount**: *function*

*Defined in [wallet.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L7)*

#### Type declaration:

▸ (`address?`: [Address](../modules/_types_.md#address)): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_types_.md#address) |

___

###  removeAccount

• **removeAccount**: *function*

*Defined in [wallet.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L6)*

#### Type declaration:

▸ (`address`: [Address](../modules/_types_.md#address)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Defined in [wallet.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L10)*

#### Type declaration:

▸ (`address`: [Address](../modules/_types_.md#address), `data`: string): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |
`data` | string |

___

###  signTransaction

• **signTransaction**: *function*

*Defined in [wallet.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L8)*

#### Type declaration:

▸ (`txParams`: [CeloTx](../modules/_types_.md#celotx)): *Promise‹[EncodedTransaction](_types_.encodedtransaction.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`txParams` | [CeloTx](../modules/_types_.md#celotx) |

___

###  signTypedData

• **signTypedData**: *function*

*Defined in [wallet.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/wallet.ts#L9)*

#### Type declaration:

▸ (`address`: [Address](../modules/_types_.md#address), `typedData`: EIP712TypedData): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |
`typedData` | EIP712TypedData |
