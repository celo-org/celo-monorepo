[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/MetaTransactionWallet"](_wrappers_metatransactionwallet_.md)

# Module: "wrappers/MetaTransactionWallet"

## Index

### Classes

* [MetaTransactionWalletWrapper](../classes/_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)

### Interfaces

* [RawTransaction](../interfaces/_wrappers_metatransactionwallet_.rawtransaction.md)
* [TransactionObjectWithValue](../interfaces/_wrappers_metatransactionwallet_.transactionobjectwithvalue.md)

### Type aliases

* [MetaTransactionWalletWrapperType](_wrappers_metatransactionwallet_.md#metatransactionwalletwrappertype)
* [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)

### Functions

* [buildMetaTxTypedData](_wrappers_metatransactionwallet_.md#const-buildmetatxtypeddata)
* [toRawTransaction](_wrappers_metatransactionwallet_.md#const-torawtransaction)
* [toTransactionBatch](_wrappers_metatransactionwallet_.md#const-totransactionbatch)

## Type aliases

###  MetaTransactionWalletWrapperType

Ƭ **MetaTransactionWalletWrapperType**: *[MetaTransactionWalletWrapper](../classes/_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)*

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:201](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L201)*

___

###  TransactionInput

Ƭ **TransactionInput**: *CeloTxObject‹T› | [TransactionObjectWithValue](../interfaces/_wrappers_metatransactionwallet_.transactionobjectwithvalue.md)‹T› | [RawTransaction](../interfaces/_wrappers_metatransactionwallet_.rawtransaction.md)*

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L27)*

## Functions

### `Const` buildMetaTxTypedData

▸ **buildMetaTxTypedData**(`walletAddress`: Address, `tx`: [RawTransaction](../interfaces/_wrappers_metatransactionwallet_.rawtransaction.md), `nonce`: number, `chainId`: number): *EIP712TypedData*

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:257](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L257)*

**Parameters:**

Name | Type |
------ | ------ |
`walletAddress` | Address |
`tx` | [RawTransaction](../interfaces/_wrappers_metatransactionwallet_.rawtransaction.md) |
`nonce` | number |
`chainId` | number |

**Returns:** *EIP712TypedData*

___

### `Const` toRawTransaction

▸ **toRawTransaction**(`tx`: [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any›): *[RawTransaction](../interfaces/_wrappers_metatransactionwallet_.rawtransaction.md)*

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:212](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L212)*

Turns any possible way to pass in a transaction into the raw values
that are actually required. This is used both internally to normalize
ways in which transactions are passed in but also public in order
for one instance of ContractKit to serialize a meta transaction to
send over the wire and be consumed somewhere else.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any› | TransactionInput<any> union of all the ways we expect transactions |

**Returns:** *[RawTransaction](../interfaces/_wrappers_metatransactionwallet_.rawtransaction.md)*

a RawTransactions that's serializable

___

### `Const` toTransactionBatch

▸ **toTransactionBatch**(`txs`: Array‹[TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any››): *object*

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:240](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L240)*

Turns an array of transaction inputs into the argument that
need to be passed to the executeTransactions call.
Main transformation is that all the `data` parts of each
transaction in the batch are concatenated and an array
of lengths is constructed.
This is a gas optimisation on the contract.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txs` | Array‹[TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any›› | Array<TransactionInput<any>> array of txs |

**Returns:** *object*

Params for the executeTransactions method call

* **callData**: *string*

* **callDataLengths**: *number[]*

* **destinations**: *string[]*

* **values**: *string[]*
