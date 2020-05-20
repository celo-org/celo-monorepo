# Class: RpcWallet

## Hierarchy

  ↳ [RemoteWallet](_wallets_remote_wallet_.remotewallet.md)

  ↳ **RpcWallet**

## Implements

* [Wallet](../interfaces/_wallets_wallet_.wallet.md)
* [Wallet](../interfaces/_wallets_wallet_.wallet.md)

## Index

### Constructors

* [constructor](_wallets_rpc_wallet_.rpcwallet.md#constructor)

### Properties

* [rpc](_wallets_rpc_wallet_.rpcwallet.md#rpc)

### Methods

* [addAccount](_wallets_rpc_wallet_.rpcwallet.md#addaccount)
* [getAccounts](_wallets_rpc_wallet_.rpcwallet.md#getaccounts)
* [hasAccount](_wallets_rpc_wallet_.rpcwallet.md#hasaccount)
* [init](_wallets_rpc_wallet_.rpcwallet.md#init)
* [isAccountUnlocked](_wallets_rpc_wallet_.rpcwallet.md#isaccountunlocked)
* [loadAccountSigners](_wallets_rpc_wallet_.rpcwallet.md#loadaccountsigners)
* [signPersonalMessage](_wallets_rpc_wallet_.rpcwallet.md#signpersonalmessage)
* [signTransaction](_wallets_rpc_wallet_.rpcwallet.md#signtransaction)
* [signTypedData](_wallets_rpc_wallet_.rpcwallet.md#signtypeddata)
* [unlockAccount](_wallets_rpc_wallet_.rpcwallet.md#unlockaccount)

## Constructors

###  constructor

\+ **new RpcWallet**(`_provider`: provider): *[RpcWallet](_wallets_rpc_wallet_.rpcwallet.md)*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`_provider` | provider |

**Returns:** *[RpcWallet](_wallets_rpc_wallet_.rpcwallet.md)*

## Properties

###  rpc

• **rpc**: *[RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md)*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L18)*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string, `passphrase`: string): *Promise‹string›*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`passphrase` | string |

**Returns:** *Promise‹string›*

___

###  getAccounts

▸ **getAccounts**(): *[Address](../modules/_base_.md#address)[]*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[getAccounts](_wallets_remote_wallet_.remotewallet.md#getaccounts)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[getAccounts](_wallets_wallet_.walletbase.md#getaccounts)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L61)*

Get a list of accounts in the remote wallet

**Returns:** *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: [Address](../modules/_base_.md#address)): *boolean*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[hasAccount](_wallets_remote_wallet_.remotewallet.md#hasaccount)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[hasAccount](_wallets_wallet_.walletbase.md#hasaccount)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L70)*

Returns true if account is in the remote wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | [Address](../modules/_base_.md#address) | Account to check  |

**Returns:** *boolean*

___

###  init

▸ **init**(): *Promise‹void›*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[init](_wallets_remote_wallet_.remotewallet.md#init)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L20)*

Discovers wallet accounts and caches results in memory
Idempotent to ensure multiple calls are benign

**Returns:** *Promise‹void›*

___

###  isAccountUnlocked

▸ **isAccountUnlocked**(`address`: string): *boolean*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L54)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *boolean*

___

###  loadAccountSigners

▸ **loadAccountSigners**(): *Promise‹Map‹string, [Signer](../interfaces/_wallets_signers_signer_.signer.md)››*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L25)*

**Returns:** *Promise‹Map‹string, [Signer](../interfaces/_wallets_signers_signer_.signer.md)››*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: [Address](../modules/_base_.md#address), `data`: string): *Promise‹string›*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[signPersonalMessage](_wallets_remote_wallet_.remotewallet.md#signpersonalmessage)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[signPersonalMessage](_wallets_wallet_.walletbase.md#signpersonalmessage)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L89)*

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

*Overrides [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[signTransaction](_wallets_remote_wallet_.remotewallet.md#signtransaction)*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L64)*

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

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[signTypedData](_wallets_remote_wallet_.remotewallet.md#signtypeddata)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[signTypedData](_wallets_wallet_.walletbase.md#signtypeddata)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L99)*

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

*Defined in [contractkit/src/wallets/rpc-wallet.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`passphrase` | string |
`duration` | number |

**Returns:** *Promise‹void›*
