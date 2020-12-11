# ReadOnlyWallet

## Hierarchy

* **ReadOnlyWallet**

  ↳ [Wallet](_wallets_wallet_.wallet.md)

## Implemented by

* [AwsHsmWallet](../classes/_wallets_aws_hsm_wallet_.awshsmwallet.md)
* [AwsHsmWallet](../classes/_wallets_aws_hsm_wallet_.awshsmwallet.md)
* [AwsHsmWallet](../classes/_wallets_aws_hsm_wallet_.awshsmwallet.md)
* [AzureHSMWallet](../classes/_wallets_azure_hsm_wallet_.azurehsmwallet.md)
* [AzureHSMWallet](../classes/_wallets_azure_hsm_wallet_.azurehsmwallet.md)
* [AzureHSMWallet](../classes/_wallets_azure_hsm_wallet_.azurehsmwallet.md)
* [LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)
* [LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)
* [LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)
* [LocalWallet](../classes/_wallets_local_wallet_.localwallet.md)
* [RemoteWallet](../classes/_wallets_remote_wallet_.remotewallet.md)
* [RemoteWallet](../classes/_wallets_remote_wallet_.remotewallet.md)
* [RpcWallet](../classes/_wallets_rpc_wallet_.rpcwallet.md)
* [RpcWallet](../classes/_wallets_rpc_wallet_.rpcwallet.md)
* [WalletBase](../classes/_wallets_wallet_.walletbase.md)

## Index

### Properties

* [computeSharedSecret](_wallets_wallet_.readonlywallet.md#computesharedsecret)
* [decrypt](_wallets_wallet_.readonlywallet.md#decrypt)
* [getAccounts](_wallets_wallet_.readonlywallet.md#getaccounts)
* [hasAccount](_wallets_wallet_.readonlywallet.md#hasaccount)
* [removeAccount](_wallets_wallet_.readonlywallet.md#removeaccount)
* [signPersonalMessage](_wallets_wallet_.readonlywallet.md#signpersonalmessage)
* [signTransaction](_wallets_wallet_.readonlywallet.md#signtransaction)
* [signTypedData](_wallets_wallet_.readonlywallet.md#signtypeddata)

## Properties

### computeSharedSecret

• **computeSharedSecret**: _function_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L21)

#### Type declaration:

▸ \(`address`: [Address](../modules/_base_.md#address), `publicKey`: string\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) |
| `publicKey` | string |

### decrypt

• **decrypt**: _function_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L20)

#### Type declaration:

▸ \(`address`: [Address](../modules/_base_.md#address), `ciphertext`: Buffer\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) |
| `ciphertext` | Buffer |

### getAccounts

• **getAccounts**: _function_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L14)

#### Type declaration:

▸ \(\): [_Address_](../modules/_base_.md#address)_\[\]_

### hasAccount

• **hasAccount**: _function_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L16)

#### Type declaration:

▸ \(`address?`: [Address](../modules/_base_.md#address)\): _boolean_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | [Address](../modules/_base_.md#address) |

### removeAccount

• **removeAccount**: _function_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L15)

#### Type declaration:

▸ \(`address`: [Address](../modules/_base_.md#address)\): _void_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) |

### signPersonalMessage

• **signPersonalMessage**: _function_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L19)

#### Type declaration:

▸ \(`address`: [Address](../modules/_base_.md#address), `data`: string\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) |
| `data` | string |

### signTransaction

• **signTransaction**: _function_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L17)

#### Type declaration:

▸ \(`txParams`: Tx\): _Promise‹EncodedTransaction›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txParams` | Tx |

### signTypedData

• **signTypedData**: _function_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L18)

#### Type declaration:

▸ \(`address`: [Address](../modules/_base_.md#address), `typedData`: EIP712TypedData\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) |
| `typedData` | EIP712TypedData |

