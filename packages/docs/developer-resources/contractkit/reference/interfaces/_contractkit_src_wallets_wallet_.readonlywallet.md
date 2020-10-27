# Interface: ReadOnlyWallet

## Hierarchy

* **ReadOnlyWallet**

  ↳ [Wallet](_contractkit_src_wallets_wallet_.wallet.md)

## Implemented by

* [AwsHsmWallet](../classes/_contractkit_src_wallets_aws_hsm_wallet_.awshsmwallet.md)
* [AwsHsmWallet](../classes/_contractkit_src_wallets_aws_hsm_wallet_.awshsmwallet.md)
* [AwsHsmWallet](../classes/_contractkit_src_wallets_aws_hsm_wallet_.awshsmwallet.md)
* [AzureHSMWallet](../classes/_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md)
* [AzureHSMWallet](../classes/_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md)
* [AzureHSMWallet](../classes/_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md)
* [LedgerWallet](../classes/_contractkit_src_wallets_ledger_wallet_.ledgerwallet.md)
* [LedgerWallet](../classes/_contractkit_src_wallets_ledger_wallet_.ledgerwallet.md)
* [LedgerWallet](../classes/_contractkit_src_wallets_ledger_wallet_.ledgerwallet.md)
* [LocalWallet](../classes/_contractkit_src_wallets_local_wallet_.localwallet.md)
* [RemoteWallet](../classes/_contractkit_src_wallets_remote_wallet_.remotewallet.md)
* [RemoteWallet](../classes/_contractkit_src_wallets_remote_wallet_.remotewallet.md)
* [RpcWallet](../classes/_contractkit_src_wallets_rpc_wallet_.rpcwallet.md)
* [RpcWallet](../classes/_contractkit_src_wallets_rpc_wallet_.rpcwallet.md)
* [WalletBase](../classes/_contractkit_src_wallets_wallet_.walletbase.md)

## Index

### Properties

* [computeSharedSecret](_contractkit_src_wallets_wallet_.readonlywallet.md#computesharedsecret)
* [decrypt](_contractkit_src_wallets_wallet_.readonlywallet.md#decrypt)
* [getAccounts](_contractkit_src_wallets_wallet_.readonlywallet.md#getaccounts)
* [hasAccount](_contractkit_src_wallets_wallet_.readonlywallet.md#hasaccount)
* [removeAccount](_contractkit_src_wallets_wallet_.readonlywallet.md#removeaccount)
* [signPersonalMessage](_contractkit_src_wallets_wallet_.readonlywallet.md#signpersonalmessage)
* [signTransaction](_contractkit_src_wallets_wallet_.readonlywallet.md#signtransaction)
* [signTypedData](_contractkit_src_wallets_wallet_.readonlywallet.md#signtypeddata)

## Properties

###  computeSharedSecret

• **computeSharedSecret**: *function*

*Defined in [packages/contractkit/src/wallets/wallet.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L21)*

#### Type declaration:

▸ (`address`: [Address](../modules/_contractkit_src_base_.md#address), `publicKey`: string): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |
`publicKey` | string |

___

###  decrypt

• **decrypt**: *function*

*Defined in [packages/contractkit/src/wallets/wallet.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L20)*

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

*Defined in [packages/contractkit/src/wallets/wallet.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L14)*

#### Type declaration:

▸ (): *[Address](../modules/_contractkit_src_base_.md#address)[]*

___

###  hasAccount

• **hasAccount**: *function*

*Defined in [packages/contractkit/src/wallets/wallet.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L16)*

#### Type declaration:

▸ (`address?`: [Address](../modules/_contractkit_src_base_.md#address)): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  removeAccount

• **removeAccount**: *function*

*Defined in [packages/contractkit/src/wallets/wallet.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L15)*

#### Type declaration:

▸ (`address`: [Address](../modules/_contractkit_src_base_.md#address)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Defined in [packages/contractkit/src/wallets/wallet.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L19)*

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

*Defined in [packages/contractkit/src/wallets/wallet.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L17)*

#### Type declaration:

▸ (`txParams`: Tx): *Promise‹EncodedTransaction›*

**Parameters:**

Name | Type |
------ | ------ |
`txParams` | Tx |

___

###  signTypedData

• **signTypedData**: *function*

*Defined in [packages/contractkit/src/wallets/wallet.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L18)*

#### Type declaration:

▸ (`address`: [Address](../modules/_contractkit_src_base_.md#address), `typedData`: EIP712TypedData): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |
`typedData` | EIP712TypedData |
