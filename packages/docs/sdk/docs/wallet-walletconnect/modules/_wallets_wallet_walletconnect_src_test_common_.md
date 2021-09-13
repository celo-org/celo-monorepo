[@celo/wallet-walletconnect](../README.md) › ["wallets/wallet-walletconnect/src/test/common"](_wallets_wallet_walletconnect_src_test_common_.md)

# Module: "wallets/wallet-walletconnect/src/test/common"

## Index

### Variables

* [testAddress](_wallets_wallet_walletconnect_src_test_common_.md#const-testaddress)
* [testPrivateKey](_wallets_wallet_walletconnect_src_test_common_.md#const-testprivatekey)
* [testWallet](_wallets_wallet_walletconnect_src_test_common_.md#const-testwallet)

### Functions

* [parseComputeSharedSecret](_wallets_wallet_walletconnect_src_test_common_.md#parsecomputesharedsecret)
* [parseDecrypt](_wallets_wallet_walletconnect_src_test_common_.md#parsedecrypt)
* [parsePersonalSign](_wallets_wallet_walletconnect_src_test_common_.md#parsepersonalsign)
* [parseSignTransaction](_wallets_wallet_walletconnect_src_test_common_.md#parsesigntransaction)
* [parseSignTypedData](_wallets_wallet_walletconnect_src_test_common_.md#parsesigntypeddata)

## Variables

### `Const` testAddress

• **testAddress**: *string* = toChecksumAddress(account)

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/test/common.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/test/common.ts#L37)*

___

### `Const` testPrivateKey

• **testPrivateKey**: *"04f9d516be49bb44346ca040bdd2736d486bca868693c74d51d274ad92f61976"* = privateKey

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/test/common.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/test/common.ts#L36)*

___

### `Const` testWallet

• **testWallet**: *ReadOnlyWallet* = wallet

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/test/common.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/test/common.ts#L35)*

## Functions

###  parseComputeSharedSecret

▸ **parseComputeSharedSecret**(`params`: any): *object*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/test/common.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/test/common.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`params` | any |

**Returns:** *object*

* **from**: *Address*

* **publicKey**: *string*

___

###  parseDecrypt

▸ **parseDecrypt**(`params`: any): *object*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/test/common.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/test/common.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`params` | any |

**Returns:** *object*

* **from**: *string*

* **payload**: *Buffer*

___

###  parsePersonalSign

▸ **parsePersonalSign**(`params`: any): *object*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/test/common.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/test/common.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`params` | any |

**Returns:** *object*

* **from**: *string*

* **payload**: *string*

___

###  parseSignTransaction

▸ **parseSignTransaction**(`params`: any): *CeloTx*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/test/common.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/test/common.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`params` | any |

**Returns:** *CeloTx*

___

###  parseSignTypedData

▸ **parseSignTypedData**(`params`: any): *object*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/test/common.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/test/common.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`params` | any |

**Returns:** *object*

* **from**: *string*

* **payload**: *[EIP712TypedData](../interfaces/_utils_src_sign_typed_data_utils_.eip712typeddata.md)*
