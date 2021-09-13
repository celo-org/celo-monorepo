[@celo/wallet-walletconnect](../README.md) › ["wallets/wallet-walletconnect/src/wc-signer"](../modules/_wallets_wallet_walletconnect_src_wc_signer_.md) › [WalletConnectSigner](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md)

# Class: WalletConnectSigner

Implements the signer interface on top of the WalletConnect interface.

## Hierarchy

* **WalletConnectSigner**

## Implements

* Signer

## Index

### Constructors

* [constructor](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md#constructor)

### Methods

* [computeSharedSecret](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md#computesharedsecret)
* [decrypt](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md#decrypt)
* [getNativeKey](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md#getnativekey)
* [signPersonalMessage](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md#signpersonalmessage)
* [signRawTransaction](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md#signrawtransaction)
* [signTransaction](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md#signtransaction)
* [signTypedData](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md#signtypeddata)

## Constructors

###  constructor

\+ **new WalletConnectSigner**(`client`: WalletConnect, `session`: SessionTypes.Settled, `account`: string, `chainId`: string): *[WalletConnectSigner](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md)*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts#L11)*

Construct a new instance of a WalletConnectSigner

**Parameters:**

Name | Type |
------ | ------ |
`client` | WalletConnect |
`session` | SessionTypes.Settled |
`account` | string |
`chainId` | string |

**Returns:** *[WalletConnectSigner](_wallets_wallet_walletconnect_src_wc_signer_.walletconnectsigner.md)*

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`publicKey`: string): *Promise‹Buffer‹››*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *Promise‹Buffer‹››*

___

###  decrypt

▸ **decrypt**(`data`: Buffer): *Promise‹Buffer‹››*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts#L54)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹object›*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

___

###  signRawTransaction

▸ **signRawTransaction**(`tx`: CeloTx): *Promise‹EncodedTransaction›*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTx |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTransaction

▸ **signTransaction**(): *Promise‹object›*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts#L22)*

**Returns:** *Promise‹object›*

___

###  signTypedData

▸ **signTypedData**(`data`: [EIP712TypedData](../interfaces/_utils_src_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹object›*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/wc-signer.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [EIP712TypedData](../interfaces/_utils_src_sign_typed_data_utils_.eip712typeddata.md) |

**Returns:** *Promise‹object›*
