# CeloTransactionObject

## Type parameters

▪ **O**

## Hierarchy

* **CeloTransactionObject**

## Index

### Constructors

* [constructor]()

### Properties

* [defaultParams]()
* [txo]()

### Methods

* [send]()
* [sendAndWaitForReceipt]()

## Constructors

### constructor

+ **new CeloTransactionObject**\(`connection`: [Connection](), `txo`: [CeloTxObject]()‹O›, `defaultParams?`: [CeloTransactionParams](_utils_celo_transaction_object_.md#celotransactionparams)\): [_CeloTransactionObject_]()

_Defined in_ [_packages/sdk/connect/src/utils/celo-transaction-object.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L15)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `connection` | [Connection]() |
| `txo` | [CeloTxObject]()‹O› |
| `defaultParams?` | [CeloTransactionParams](_utils_celo_transaction_object_.md#celotransactionparams) |

**Returns:** [_CeloTransactionObject_]()

## Properties

### `Optional` `Readonly` defaultParams

• **defaultParams**? : [_CeloTransactionParams_](_utils_celo_transaction_object_.md#celotransactionparams)

_Defined in_ [_packages/sdk/connect/src/utils/celo-transaction-object.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L19)

### `Readonly` txo

• **txo**: [_CeloTxObject_]()_‹O›_

_Defined in_ [_packages/sdk/connect/src/utils/celo-transaction-object.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L18)

## Methods

### send

▸ **send**\(`params?`: [CeloTransactionParams](_utils_celo_transaction_object_.md#celotransactionparams)\): _Promise‹_[_TransactionResult_]()_›_

_Defined in_ [_packages/sdk/connect/src/utils/celo-transaction-object.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L23)

send the transaction to the chain

**Parameters:**

| Name | Type |
| :--- | :--- |
| `params?` | [CeloTransactionParams](_utils_celo_transaction_object_.md#celotransactionparams) |

**Returns:** _Promise‹_[_TransactionResult_]()_›_

### sendAndWaitForReceipt

▸ **sendAndWaitForReceipt**\(`params?`: [CeloTransactionParams](_utils_celo_transaction_object_.md#celotransactionparams)\): _Promise‹_[_CeloTxReceipt_](_types_.md#celotxreceipt)_›_

_Defined in_ [_packages/sdk/connect/src/utils/celo-transaction-object.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L28)

send the transaction and waits for the receipt

**Parameters:**

| Name | Type |
| :--- | :--- |
| `params?` | [CeloTransactionParams](_utils_celo_transaction_object_.md#celotransactionparams) |

**Returns:** _Promise‹_[_CeloTxReceipt_](_types_.md#celotxreceipt)_›_

