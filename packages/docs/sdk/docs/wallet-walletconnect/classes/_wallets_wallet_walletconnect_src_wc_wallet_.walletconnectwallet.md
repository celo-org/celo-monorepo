[@celo/wallet-walletconnect](../README.md) › ["wallets/wallet-walletconnect/src/wc-wallet"](../modules/_wallets_wallet_walletconnect_src_wc_wallet_.md) › [WalletConnectWallet](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md)

# Class: WalletConnectWallet

## Hierarchy

* RemoteWallet‹[WalletConnectSigner](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md)›

  ↳ **WalletConnectWallet**

## Implements

* ReadOnlyWallet
* ReadOnlyWallet

## Index

### Constructors

* [constructor](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#constructor)

### Properties

* [isSetupFinished](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#issetupfinished)

### Methods

* [close](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#close)
* [computeSharedSecret](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#computesharedsecret)
* [decrypt](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#decrypt)
* [getAccounts](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#getaccounts)
* [getUri](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#geturi)
* [hasAccount](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#hasaccount)
* [init](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#init)
* [loadAccountSigners](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#loadaccountsigners)
* [onPairingCreated](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#onpairingcreated)
* [onPairingDeleted](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#onpairingdeleted)
* [onPairingProposal](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#onpairingproposal)
* [onPairingUpdated](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#onpairingupdated)
* [onSessionCreated](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#onsessioncreated)
* [onSessionDeleted](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#onsessiondeleted)
* [onSessionProposal](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#onsessionproposal)
* [onSessionUpdated](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#onsessionupdated)
* [removeAccount](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#removeaccount)
* [signPersonalMessage](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#signpersonalmessage)
* [signTransaction](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#signtransaction)
* [signTypedData](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#signtypeddata)

## Constructors

###  constructor

\+ **new WalletConnectWallet**(`__namedParameters`: object): *[WalletConnectWallet](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md)*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts#L63)*

**Parameters:**

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`connect` | undefined &#124; Optional‹ConnectParams, "permissions"› |
`init` | undefined &#124; ClientOptions |

**Returns:** *[WalletConnectWallet](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md)*

## Properties

###  isSetupFinished

• **isSetupFinished**: *function*

*Inherited from [WalletConnectWallet](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md).[isSetupFinished](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#issetupfinished)*

Defined in packages/sdk/wallets/wallet-remote/lib/remote-wallet.d.ts:51

#### Type declaration:

▸ (): *boolean*

## Methods

###  close

▸ **close**(): *Promise‹void›*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts:176](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts#L176)*

**Returns:** *Promise‹void›*

___

###  computeSharedSecret

▸ **computeSharedSecret**(`address`: Address, `publicKey`: string): *Promise‹Buffer›*

*Inherited from [WalletConnectWallet](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md).[computeSharedSecret](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#computesharedsecret)*

Defined in packages/sdk/wallets/wallet-base/lib/wallet-base.d.ts:64

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

*Inherited from [WalletConnectWallet](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md).[decrypt](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#decrypt)*

Defined in packages/sdk/wallets/wallet-base/lib/wallet-base.d.ts:60

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer›*

___

###  getAccounts

▸ **getAccounts**(): *Address[]*

*Inherited from [WalletConnectWallet](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md).[getAccounts](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#getaccounts)*

*Overrides void*

Defined in packages/sdk/wallets/wallet-remote/lib/remote-wallet.d.ts:27

Get a list of accounts in the remote wallet

**Returns:** *Address[]*

___

###  getUri

▸ **getUri**(): *Promise‹string | void›*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts#L82)*

Get the URI needed for out of band session establishment

**Returns:** *Promise‹string | void›*

___

###  hasAccount

▸ **hasAccount**(`address?`: Address): *boolean*

*Inherited from [WalletConnectWallet](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md).[hasAccount](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#hasaccount)*

*Overrides void*

Defined in packages/sdk/wallets/wallet-remote/lib/remote-wallet.d.ts:32

Returns true if account is in the remote wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | Address | Account to check  |

**Returns:** *boolean*

___

###  init

▸ **init**(): *Promise‹void›*

*Inherited from [WalletConnectWallet](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md).[init](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#init)*

Defined in packages/sdk/wallets/wallet-remote/lib/remote-wallet.d.ts:15

Discovers wallet accounts and caches results in memory
Idempotent to ensure multiple calls are benign

**Returns:** *Promise‹void›*

___

###  loadAccountSigners

▸ **loadAccountSigners**(): *Promise‹Map‹string, [WalletConnectSigner](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md)››*

*Overrides void*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts#L147)*

**Returns:** *Promise‹Map‹string, [WalletConnectSigner](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md)››*

___

###  onPairingCreated

▸ **onPairingCreated**(`pairing`: PairingTypes.Created): *void*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts:130](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts#L130)*

**Parameters:**

Name | Type |
------ | ------ |
`pairing` | PairingTypes.Created |

**Returns:** *void*

___

###  onPairingDeleted

▸ **onPairingDeleted**(): *void*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts:142](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts#L142)*

**Returns:** *void*

___

###  onPairingProposal

▸ **onPairingProposal**(`pairingProposal`: PairingTypes.Proposal): *void*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts:126](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts#L126)*

**Parameters:**

Name | Type |
------ | ------ |
`pairingProposal` | PairingTypes.Proposal |

**Returns:** *void*

___

###  onPairingUpdated

▸ **onPairingUpdated**(`pairing`: PairingTypes.Update): *void*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts#L134)*

**Parameters:**

Name | Type |
------ | ------ |
`pairing` | PairingTypes.Update |

**Returns:** *void*

___

###  onSessionCreated

▸ **onSessionCreated**(`session`: SessionTypes.Created): *void*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts#L114)*

**Parameters:**

Name | Type |
------ | ------ |
`session` | SessionTypes.Created |

**Returns:** *void*

___

###  onSessionDeleted

▸ **onSessionDeleted**(): *void*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts#L121)*

**Returns:** *void*

___

###  onSessionProposal

▸ **onSessionProposal**(`sessionProposal`: SessionTypes.Proposal): *void*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts#L111)*

**Parameters:**

Name | Type |
------ | ------ |
`sessionProposal` | SessionTypes.Proposal |

**Returns:** *void*

___

###  onSessionUpdated

▸ **onSessionUpdated**(`session`: SessionTypes.Update): *void*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts#L118)*

**Parameters:**

Name | Type |
------ | ------ |
`session` | SessionTypes.Update |

**Returns:** *void*

___

###  removeAccount

▸ **removeAccount**(`_address`: string): *void*

*Inherited from [WalletConnectWallet](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md).[removeAccount](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#removeaccount)*

Defined in packages/sdk/wallets/wallet-base/lib/wallet-base.d.ts:23

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

Name | Type |
------ | ------ |
`_address` | string |

**Returns:** *void*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: Address, `data`: string): *Promise‹string›*

*Inherited from [WalletConnectWallet](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md).[signPersonalMessage](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#signpersonalmessage)*

*Overrides void*

Defined in packages/sdk/wallets/wallet-remote/lib/remote-wallet.d.ts:43

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

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts:170](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-wallet.ts#L170)*

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

*Inherited from [WalletConnectWallet](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md).[signTypedData](_wallets_wallet_walletconnect_src_wc_wallet_.walletconnectwallet.md#signtypeddata)*

*Overrides void*

Defined in packages/sdk/wallets/wallet-remote/lib/remote-wallet.d.ts:49

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
