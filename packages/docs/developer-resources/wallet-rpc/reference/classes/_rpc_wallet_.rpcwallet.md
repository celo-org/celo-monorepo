# Class: RpcWallet

## Hierarchy

* RemoteWallet‹[RpcSigner](_rpc_signer_.rpcsigner.md)›

  ↳ **RpcWallet**

## Implements

* ReadOnlyWallet
* ReadOnlyWallet
* UnlockableWallet

## Index

### Constructors

* [constructor](_rpc_wallet_.rpcwallet.md#constructor)

### Properties

* [isSetupFinished](_rpc_wallet_.rpcwallet.md#issetupfinished)

### Methods

* [addAccount](_rpc_wallet_.rpcwallet.md#addaccount)
* [computeSharedSecret](_rpc_wallet_.rpcwallet.md#computesharedsecret)
* [decrypt](_rpc_wallet_.rpcwallet.md#decrypt)
* [getAccounts](_rpc_wallet_.rpcwallet.md#getaccounts)
* [hasAccount](_rpc_wallet_.rpcwallet.md#hasaccount)
* [init](_rpc_wallet_.rpcwallet.md#init)
* [isAccountUnlocked](_rpc_wallet_.rpcwallet.md#isaccountunlocked)
* [loadAccountSigners](_rpc_wallet_.rpcwallet.md#loadaccountsigners)
* [removeAccount](_rpc_wallet_.rpcwallet.md#removeaccount)
* [signPersonalMessage](_rpc_wallet_.rpcwallet.md#signpersonalmessage)
* [signTransaction](_rpc_wallet_.rpcwallet.md#signtransaction)
* [signTypedData](_rpc_wallet_.rpcwallet.md#signtypeddata)
* [unlockAccount](_rpc_wallet_.rpcwallet.md#unlockaccount)

## Constructors

###  constructor

\+ **new RpcWallet**(`_provider`: Provider): *[RpcWallet](_rpc_wallet_.rpcwallet.md)*

*Defined in [wallet-rpc/src/rpc-wallet.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-wallet.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`_provider` | Provider |

**Returns:** *[RpcWallet](_rpc_wallet_.rpcwallet.md)*

## Properties

###  isSetupFinished

• **isSetupFinished**: *function*

*Inherited from [RpcWallet](_rpc_wallet_.rpcwallet.md).[isSetupFinished](_rpc_wallet_.rpcwallet.md#issetupfinished)*

Defined in wallet-remote/lib/remote-wallet.d.ts:51

#### Type declaration:

▸ (): *boolean*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string, `passphrase`: string): *Promise‹string›*

*Defined in [wallet-rpc/src/rpc-wallet.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-wallet.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`passphrase` | string |

**Returns:** *Promise‹string›*

___

###  computeSharedSecret

▸ **computeSharedSecret**(`address`: Address, `publicKey`: string): *Promise‹Buffer›*

*Inherited from [RpcWallet](_rpc_wallet_.rpcwallet.md).[computeSharedSecret](_rpc_wallet_.rpcwallet.md#computesharedsecret)*

Defined in wallet-base/lib/wallet-base.d.ts:64

Computes the shared secret (an ECDH key exchange object) between two accounts

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |
`publicKey` | string |

**Returns:** *Promise‹Buffer›*

___

###  decrypt

▸ **decrypt**(`address`: string, `ciphertext`: Buffer): *Promise‹Buffer›*

*Inherited from [RpcWallet](_rpc_wallet_.rpcwallet.md).[decrypt](_rpc_wallet_.rpcwallet.md#decrypt)*

Defined in wallet-base/lib/wallet-base.d.ts:60

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer›*

___

###  getAccounts

▸ **getAccounts**(): *Address[]*

*Inherited from [RpcWallet](_rpc_wallet_.rpcwallet.md).[getAccounts](_rpc_wallet_.rpcwallet.md#getaccounts)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:27

Get a list of accounts in the remote wallet

**Returns:** *Address[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: Address): *boolean*

*Inherited from [RpcWallet](_rpc_wallet_.rpcwallet.md).[hasAccount](_rpc_wallet_.rpcwallet.md#hasaccount)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:32

Returns true if account is in the remote wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | Address | Account to check  |

**Returns:** *boolean*

___

###  init

▸ **init**(): *Promise‹void›*

*Inherited from [RpcWallet](_rpc_wallet_.rpcwallet.md).[init](_rpc_wallet_.rpcwallet.md#init)*

Defined in wallet-remote/lib/remote-wallet.d.ts:15

Discovers wallet accounts and caches results in memory
Idempotent to ensure multiple calls are benign

**Returns:** *Promise‹void›*

___

###  isAccountUnlocked

▸ **isAccountUnlocked**(`address`: string): *boolean*

*Defined in [wallet-rpc/src/rpc-wallet.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-wallet.ts#L54)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *boolean*

___

###  loadAccountSigners

▸ **loadAccountSigners**(): *Promise‹Map‹string, [RpcSigner](_rpc_signer_.rpcsigner.md)››*

*Overrides void*

*Defined in [wallet-rpc/src/rpc-wallet.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-wallet.ts#L25)*

**Returns:** *Promise‹Map‹string, [RpcSigner](_rpc_signer_.rpcsigner.md)››*

___

###  removeAccount

▸ **removeAccount**(`_address`: string): *void*

*Inherited from [RpcWallet](_rpc_wallet_.rpcwallet.md).[removeAccount](_rpc_wallet_.rpcwallet.md#removeaccount)*

Defined in wallet-base/lib/wallet-base.d.ts:23

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

Name | Type |
------ | ------ |
`_address` | string |

**Returns:** *void*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: Address, `data`: string): *Promise‹string›*

*Inherited from [RpcWallet](_rpc_wallet_.rpcwallet.md).[signPersonalMessage](_rpc_wallet_.rpcwallet.md#signpersonalmessage)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:43

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the account to sign with |
`data` | string | Hex string message to sign |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  signTransaction

▸ **signTransaction**(`txParams`: CeloTx): *Promise‹EncodedTransaction›*

*Overrides void*

*Defined in [wallet-rpc/src/rpc-wallet.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-wallet.ts#L64)*

Gets the signer based on the 'from' field in the tx body

**`dev`** overrides WalletBase.signTransaction

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | CeloTx | Transaction to sign |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: Address, `typedData`: EIP712TypedData): *Promise‹string›*

*Inherited from [RpcWallet](_rpc_wallet_.rpcwallet.md).[signTypedData](_rpc_wallet_.rpcwallet.md#signtypeddata)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:49

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  unlockAccount

▸ **unlockAccount**(`address`: string, `passphrase`: string, `duration`: number): *Promise‹boolean›*

*Defined in [wallet-rpc/src/rpc-wallet.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-rpc/src/rpc-wallet.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`passphrase` | string |
`duration` | number |

**Returns:** *Promise‹boolean›*
