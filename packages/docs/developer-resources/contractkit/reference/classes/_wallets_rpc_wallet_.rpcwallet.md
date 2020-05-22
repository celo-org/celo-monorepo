# Class: RpcWallet

## Hierarchy

* [WalletBase](_wallets_wallet_.walletbase.md)

  ↳ **RpcWallet**

## Implements

* [Wallet](../interfaces/_wallets_wallet_.wallet.md)

## Index

### Constructors

* [constructor](_wallets_rpc_wallet_.rpcwallet.md#constructor)

### Methods

* [addAccount](_wallets_rpc_wallet_.rpcwallet.md#addaccount)
* [getAccounts](_wallets_rpc_wallet_.rpcwallet.md#getaccounts)
* [hasAccount](_wallets_rpc_wallet_.rpcwallet.md#hasaccount)
* [isAccountUnlocked](_wallets_rpc_wallet_.rpcwallet.md#isaccountunlocked)
* [signPersonalMessage](_wallets_rpc_wallet_.rpcwallet.md#signpersonalmessage)
* [signTransaction](_wallets_rpc_wallet_.rpcwallet.md#signtransaction)
* [signTypedData](_wallets_rpc_wallet_.rpcwallet.md#signtypeddata)
* [unlockAccount](_wallets_rpc_wallet_.rpcwallet.md#unlockaccount)

## Constructors

###  constructor

\+ **new RpcWallet**(`_provider`: provider): *[RpcWallet](_wallets_rpc_wallet_.rpcwallet.md)*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`_provider` | provider |

**Returns:** *[RpcWallet](_wallets_rpc_wallet_.rpcwallet.md)*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string, `passphrase`: string): *Promise‹string›*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`passphrase` | string |

**Returns:** *Promise‹string›*

___

###  getAccounts

▸ **getAccounts**(): *[Address](../modules/_base_.md#address)[]*

*Inherited from [WalletBase](_wallets_wallet_.walletbase.md).[getAccounts](_wallets_wallet_.walletbase.md#getaccounts)*

*Defined in [contractkit/src/wallets/wallet.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L29)*

Gets a list of accounts that have been registered

**Returns:** *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: [Address](../modules/_base_.md#address)): *boolean*

*Inherited from [WalletBase](_wallets_wallet_.walletbase.md).[hasAccount](_wallets_wallet_.walletbase.md#hasaccount)*

*Defined in [contractkit/src/wallets/wallet.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L37)*

Returns true if account has been registered

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | [Address](../modules/_base_.md#address) | Account to check  |

**Returns:** *boolean*

___

###  isAccountUnlocked

▸ **isAccountUnlocked**(`address`: string): *boolean*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *boolean*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: [Address](../modules/_base_.md#address), `data`: string): *Promise‹string›*

*Inherited from [WalletBase](_wallets_wallet_.walletbase.md).[signPersonalMessage](_wallets_wallet_.walletbase.md#signpersonalmessage)*

*Defined in [contractkit/src/wallets/wallet.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L81)*

Sign a personal Ethereum signed message.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
`data` | string | Hex string message to sign |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  signTransaction

▸ **signTransaction**(`txParams`: Tx): *Promise‹EncodedTransaction›*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[signTransaction](_wallets_wallet_.walletbase.md#signtransaction)*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L51)*

Gets the signer based on the 'from' field in the tx body

**`dev`** overrides WalletBase.signTransaction

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | Tx | Transaction to sign |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: [Address](../modules/_base_.md#address), `typedData`: [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹string›*

*Inherited from [WalletBase](_wallets_wallet_.walletbase.md).[signTypedData](_wallets_wallet_.walletbase.md#signtypeddata)*

*Defined in [contractkit/src/wallets/wallet.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L98)*

Sign an EIP712 Typed Data message.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
`typedData` | [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md) | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  unlockAccount

▸ **unlockAccount**(`address`: string, `passphrase`: string, `duration`: number): *Promise‹void›*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`passphrase` | string |
`duration` | number |

**Returns:** *Promise‹void›*
