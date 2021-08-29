# wrappers/MetaTransactionWallet

## Index

### Classes

* [MetaTransactionWalletWrapper]()

### Interfaces

* [RawTransaction]()
* [TransactionObjectWithValue]()

### Type aliases

* [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)

### Functions

* [buildMetaTxTypedData](_wrappers_metatransactionwallet_.md#const-buildmetatxtypeddata)
* [toRawTransaction](_wrappers_metatransactionwallet_.md#const-torawtransaction)
* [toTransactionBatch](_wrappers_metatransactionwallet_.md#const-totransactionbatch)

## Type aliases

### TransactionInput

Ƭ **TransactionInput**: _CeloTxObject‹T› \|_ [_TransactionObjectWithValue_]()_‹T› \|_ [_RawTransaction_]()

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L27)

## Functions

### `Const` buildMetaTxTypedData

▸ **buildMetaTxTypedData**\(`walletAddress`: Address, `tx`: [RawTransaction](), `nonce`: number, `chainId`: number\): _EIP712TypedData_

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:255_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L255)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `walletAddress` | Address |
| `tx` | [RawTransaction]() |
| `nonce` | number |
| `chainId` | number |

**Returns:** _EIP712TypedData_

### `Const` toRawTransaction

▸ **toRawTransaction**\(`tx`: [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any›\): [_RawTransaction_]()

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:210_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L210)

Turns any possible way to pass in a transaction into the raw values that are actually required. This is used both internally to normalize ways in which transactions are passed in but also public in order for one instance of ContractKit to serialize a meta transaction to send over the wire and be consumed somewhere else.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any› | TransactionInput union of all the ways we expect transactions |

**Returns:** [_RawTransaction_]()

a RawTransactions that's serializable

### `Const` toTransactionBatch

▸ **toTransactionBatch**\(`txs`: Array‹[TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any››\): _object_

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:238_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L238)

Turns an array of transaction inputs into the argument that need to be passed to the executeTransactions call. Main transformation is that all the `data` parts of each transaction in the batch are concatenated and an array of lengths is constructed. This is a gas optimisation on the contract.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txs` | Array‹[TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any›› | Array&gt; array of txs |

**Returns:** _object_

Params for the executeTransactions method call

* **callData**: _string_
* **callDataLengths**: _number\[\]_
* **destinations**: _string\[\]_
* **values**: _string\[\]_

