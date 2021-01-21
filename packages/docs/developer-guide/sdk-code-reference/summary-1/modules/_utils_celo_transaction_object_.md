# utils/celo-transaction-object

## Index

### Classes

* [CeloTransactionObject]()

### Type aliases

* [CeloTransactionParams](_utils_celo_transaction_object_.md#celotransactionparams)

### Functions

* [toTransactionObject](_utils_celo_transaction_object_.md#totransactionobject)

## Type aliases

### CeloTransactionParams

Ƭ **CeloTransactionParams**: _Omit‹_[_CeloTx_](_types_.md#celotx)_, "data"›_

_Defined in_ [_packages/sdk/connect/src/utils/celo-transaction-object.ts:5_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L5)

## Functions

### toTransactionObject

▸ **toTransactionObject**&lt;**O**&gt;\(`connection`: [Connection](), `txo`: [CeloTxObject]()‹O›, `defaultParams?`: [CeloTransactionParams](_utils_celo_transaction_object_.md#celotransactionparams)\): [_CeloTransactionObject_]()_‹O›_

_Defined in_ [_packages/sdk/connect/src/utils/celo-transaction-object.ts:7_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L7)

**Type parameters:**

▪ **O**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `connection` | [Connection]() |
| `txo` | [CeloTxObject]()‹O› |
| `defaultParams?` | [CeloTransactionParams](_utils_celo_transaction_object_.md#celotransactionparams) |

**Returns:** [_CeloTransactionObject_]()_‹O›_

