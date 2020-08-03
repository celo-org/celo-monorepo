# Class: RpcWallet

## Hierarchy

  ↳ [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md)

  ↳ **RpcWallet**

## Implements

* [Wallet](../interfaces/_contractkit_src_wallets_wallet_.wallet.md)
* [Wallet](../interfaces/_contractkit_src_wallets_wallet_.wallet.md)

## Index

### Constructors

* [constructor](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md#constructor)

### Methods

* [addAccount](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md#addaccount)
* [decrypt](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md#decrypt)
* [getAccounts](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md#getaccounts)
* [hasAccount](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md#hasaccount)
* [init](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md#init)
* [isAccountUnlocked](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md#isaccountunlocked)
* [isSetupFinished](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md#issetupfinished)
* [loadAccountSigners](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md#loadaccountsigners)
* [signPersonalMessage](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md#signpersonalmessage)
* [signTransaction](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md#signtransaction)
* [signTypedData](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md#signtypeddata)
* [unlockAccount](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md#unlockaccount)

## Constructors

###  constructor

\+ **new RpcWallet**(`_provider`: provider): *[RpcWallet](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md)*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`_provider` | provider |

**Returns:** *[RpcWallet](_contractkit_src_wallets_rpc_wallet_.rpcwallet.md)*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string, `passphrase`: string): *Promise‹string›*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`passphrase` | string |

**Returns:** *Promise‹string›*

___

###  decrypt

▸ **decrypt**(`address`: string, `ciphertext`: Buffer): *Promise‹Buffer‹››*

*Inherited from [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[decrypt](_contractkit_src_wallets_wallet_.walletbase.md#decrypt)*

*Defined in [contractkit/src/wallets/wallet.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L121)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getAccounts

▸ **getAccounts**(): *[Address](../modules/_contractkit_src_base_.md#address)[]*

*Inherited from [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[getAccounts](_contractkit_src_wallets_remote_wallet_.remotewallet.md#getaccounts)*

*Overrides [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[getAccounts](_contractkit_src_wallets_wallet_.walletbase.md#getaccounts)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L61)*

Get a list of accounts in the remote wallet

**Returns:** *[Address](../modules/_contractkit_src_base_.md#address)[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: [Address](../modules/_contractkit_src_base_.md#address)): *boolean*

*Inherited from [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[hasAccount](_contractkit_src_wallets_remote_wallet_.remotewallet.md#hasaccount)*

*Overrides [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[hasAccount](_contractkit_src_wallets_wallet_.walletbase.md#hasaccount)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L70)*

Returns true if account is in the remote wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | [Address](../modules/_contractkit_src_base_.md#address) | Account to check  |

**Returns:** *boolean*

___

###  init

▸ **init**(): *Promise‹void›*

*Inherited from [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[init](_contractkit_src_wallets_remote_wallet_.remotewallet.md#init)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L20)*

Discovers wallet accounts and caches results in memory
Idempotent to ensure multiple calls are benign

**Returns:** *Promise‹void›*

___

###  isAccountUnlocked

▸ **isAccountUnlocked**(`address`: string): *boolean*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *boolean*

___

###  isSetupFinished

▸ **isSetupFinished**(): *boolean*

*Inherited from [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[isSetupFinished](_contractkit_src_wallets_remote_wallet_.remotewallet.md#issetupfinished)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L110)*

**Returns:** *boolean*

___

###  loadAccountSigners

▸ **loadAccountSigners**(): *Promise‹Map‹string, [Signer](../interfaces/_contractkit_src_wallets_signers_signer_.signer.md)››*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L29)*

**Returns:** *Promise‹Map‹string, [Signer](../interfaces/_contractkit_src_wallets_signers_signer_.signer.md)››*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: [Address](../modules/_contractkit_src_base_.md#address), `data`: string): *Promise‹string›*

*Inherited from [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[signPersonalMessage](_contractkit_src_wallets_remote_wallet_.remotewallet.md#signpersonalmessage)*

*Overrides [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[signPersonalMessage](_contractkit_src_wallets_wallet_.walletbase.md#signpersonalmessage)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L89)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the account to sign with |
`data` | string | Hex string message to sign |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  signTransaction

▸ **signTransaction**(`txParams`: Tx): *Promise‹EncodedTransaction›*

*Overrides [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[signTransaction](_contractkit_src_wallets_remote_wallet_.remotewallet.md#signtransaction)*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L68)*

Gets the signer based on the 'from' field in the tx body

**`dev`** overrides WalletBase.signTransaction

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | Tx | Transaction to sign |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: [Address](../modules/_contractkit_src_base_.md#address), `typedData`: EIP712TypedData): *Promise‹string›*

*Inherited from [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[signTypedData](_contractkit_src_wallets_remote_wallet_.remotewallet.md#signtypeddata)*

*Overrides [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[signTypedData](_contractkit_src_wallets_wallet_.walletbase.md#signtypeddata)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L99)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  unlockAccount

▸ **unlockAccount**(`address`: string, `passphrase`: string, `duration`: number): *Promise‹boolean›*

*Defined in [contractkit/src/wallets/rpc-wallet.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/rpc-wallet.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`passphrase` | string |
`duration` | number |

**Returns:** *Promise‹boolean›*
