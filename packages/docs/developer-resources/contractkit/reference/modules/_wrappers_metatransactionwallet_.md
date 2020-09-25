# External module: "wrappers/MetaTransactionWallet"

## Index

### Classes

* [MetaTransactionWalletWrapper](../classes/_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)

### Interfaces

* [RawTransaction](../interfaces/_wrappers_metatransactionwallet_.rawtransaction.md)
* [TransactionObjectWithValue](../interfaces/_wrappers_metatransactionwallet_.transactionobjectwithvalue.md)

### Type aliases

* [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)

### Functions

* [buildMetaTxTypedData](_wrappers_metatransactionwallet_.md#const-buildmetatxtypeddata)

## Type aliases

###  TransactionInput

Ƭ **TransactionInput**: *TransactionObject‹T› | [TransactionObjectWithValue](../interfaces/_wrappers_metatransactionwallet_.transactionobjectwithvalue.md)‹T› | [RawTransaction](../interfaces/_wrappers_metatransactionwallet_.rawtransaction.md)*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L32)*

## Functions

### `Const` buildMetaTxTypedData

▸ **buildMetaTxTypedData**(`walletAddress`: [Address](_base_.md#address), `tx`: [RawTransaction](../interfaces/_wrappers_metatransactionwallet_.rawtransaction.md), `nonce`: number, `chainId`: number): *EIP712TypedData*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:259](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L259)*

**Parameters:**

Name | Type |
------ | ------ |
`walletAddress` | [Address](_base_.md#address) |
`tx` | [RawTransaction](../interfaces/_wrappers_metatransactionwallet_.rawtransaction.md) |
`nonce` | number |
`chainId` | number |

**Returns:** *EIP712TypedData*
