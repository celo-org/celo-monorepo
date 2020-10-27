# External module: "contractkit/src/wrappers/MetaTransactionWallet"

## Index

### Classes

* [MetaTransactionWalletWrapper](../classes/_contractkit_src_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)

### Interfaces

* [RawTransaction](../interfaces/_contractkit_src_wrappers_metatransactionwallet_.rawtransaction.md)
* [TransactionObjectWithValue](../interfaces/_contractkit_src_wrappers_metatransactionwallet_.transactionobjectwithvalue.md)

### Type aliases

* [TransactionInput](_contractkit_src_wrappers_metatransactionwallet_.md#transactioninput)

### Functions

* [buildMetaTxTypedData](_contractkit_src_wrappers_metatransactionwallet_.md#const-buildmetatxtypeddata)
* [toRawTransaction](_contractkit_src_wrappers_metatransactionwallet_.md#const-torawtransaction)
* [toTransactionBatch](_contractkit_src_wrappers_metatransactionwallet_.md#const-totransactionbatch)

## Type aliases

###  TransactionInput

Ƭ **TransactionInput**: *TransactionObject‹T› | [TransactionObjectWithValue](../interfaces/_contractkit_src_wrappers_metatransactionwallet_.transactionobjectwithvalue.md)‹T› | [RawTransaction](../interfaces/_contractkit_src_wrappers_metatransactionwallet_.rawtransaction.md)*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L30)*

## Functions

### `Const` buildMetaTxTypedData

▸ **buildMetaTxTypedData**(`walletAddress`: [Address](_contractkit_src_base_.md#address), `tx`: [RawTransaction](../interfaces/_contractkit_src_wrappers_metatransactionwallet_.rawtransaction.md), `nonce`: number, `chainId`: number): *EIP712TypedData*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:260](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L260)*

**Parameters:**

Name | Type |
------ | ------ |
`walletAddress` | [Address](_contractkit_src_base_.md#address) |
`tx` | [RawTransaction](../interfaces/_contractkit_src_wrappers_metatransactionwallet_.rawtransaction.md) |
`nonce` | number |
`chainId` | number |

**Returns:** *EIP712TypedData*

___

### `Const` toRawTransaction

▸ **toRawTransaction**(`tx`: [TransactionInput](_contractkit_src_wrappers_metatransactionwallet_.md#transactioninput)‹any›): *[RawTransaction](../interfaces/_contractkit_src_wrappers_metatransactionwallet_.rawtransaction.md)*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:215](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L215)*

Turns any possible way to pass in a transaction into the raw values
that are actually required. This is used both internally to normalize
ways in which transactions are passed in but also public in order
for one instance of ContractKit to serialize a meta transaction to
send over the wire and be consumed somewhere else.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | [TransactionInput](_contractkit_src_wrappers_metatransactionwallet_.md#transactioninput)‹any› | TransactionInput<any> union of all the ways we expect transactions |

**Returns:** *[RawTransaction](../interfaces/_contractkit_src_wrappers_metatransactionwallet_.rawtransaction.md)*

a RawTransactions that's serializable

___

### `Const` toTransactionBatch

▸ **toTransactionBatch**(`txs`: Array‹[TransactionInput](_contractkit_src_wrappers_metatransactionwallet_.md#transactioninput)‹any››): *object*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L243)*

Turns an array of transaction inputs into the argument that
need to be passed to the executeTransactions call.
Main transformation is that all the `data` parts of each
transaction in the batch are concatenated and an array
of lengths is constructed.
This is a gas optimisation on the contract.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txs` | Array‹[TransactionInput](_contractkit_src_wrappers_metatransactionwallet_.md#transactioninput)‹any›› | Array<TransactionInput<any>> array of txs |

**Returns:** *object*

Params for the executeTransactions method call

* **callData**: *string*

* **callDataLengths**: *number[]*

* **destinations**: *string[]*

* **values**: *string[]*
