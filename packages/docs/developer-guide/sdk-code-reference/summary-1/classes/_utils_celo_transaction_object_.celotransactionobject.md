# CeloTransactionObject

## Type parameters

▪ **O**

## Hierarchy

* **CeloTransactionObject**

## Index

### Constructors

* [constructor](_utils_celo_transaction_object_.celotransactionobject.md#constructor)

### Properties

* [defaultParams](_utils_celo_transaction_object_.celotransactionobject.md#optional-readonly-defaultparams)
* [txo](_utils_celo_transaction_object_.celotransactionobject.md#readonly-txo)

### Methods

* [send](_utils_celo_transaction_object_.celotransactionobject.md#send)
* [sendAndWaitForReceipt](_utils_celo_transaction_object_.celotransactionobject.md#sendandwaitforreceipt)

## Constructors

### constructor

+ **new CeloTransactionObject**\(`connection`: [Connection](_connection_.connection.md), `txo`: [CeloTxObject](../interfaces/_types_.celotxobject.md)‹O›, `defaultParams?`: [CeloTransactionParams](../modules/_utils_celo_transaction_object_.md#celotransactionparams)\): [_CeloTransactionObject_](_utils_celo_transaction_object_.celotransactionobject.md)

_Defined in_ [_packages/sdk/connect/src/utils/celo-transaction-object.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L15)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `connection` | [Connection](_connection_.connection.md) |
| `txo` | [CeloTxObject](../interfaces/_types_.celotxobject.md)‹O› |
| `defaultParams?` | [CeloTransactionParams](../modules/_utils_celo_transaction_object_.md#celotransactionparams) |

**Returns:** [_CeloTransactionObject_](_utils_celo_transaction_object_.celotransactionobject.md)

## Properties

### `Optional` `Readonly` defaultParams

• **defaultParams**? : [_CeloTransactionParams_](../modules/_utils_celo_transaction_object_.md#celotransactionparams)

_Defined in_ [_packages/sdk/connect/src/utils/celo-transaction-object.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L19)

### `Readonly` txo

• **txo**: [_CeloTxObject_](../interfaces/_types_.celotxobject.md)_‹O›_

_Defined in_ [_packages/sdk/connect/src/utils/celo-transaction-object.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L18)

## Methods

### send

▸ **send**\(`params?`: [CeloTransactionParams](../modules/_utils_celo_transaction_object_.md#celotransactionparams)\): _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

_Defined in_ [_packages/sdk/connect/src/utils/celo-transaction-object.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L23)

send the transaction to the chain

**Parameters:**

| Name | Type |
| :--- | :--- |
| `params?` | [CeloTransactionParams](../modules/_utils_celo_transaction_object_.md#celotransactionparams) |

**Returns:** _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

### sendAndWaitForReceipt

▸ **sendAndWaitForReceipt**\(`params?`: [CeloTransactionParams](../modules/_utils_celo_transaction_object_.md#celotransactionparams)\): _Promise‹_[_CeloTxReceipt_](../modules/_types_.md#celotxreceipt)_›_

_Defined in_ [_packages/sdk/connect/src/utils/celo-transaction-object.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L28)

send the transaction and waits for the receipt

**Parameters:**

| Name | Type |
| :--- | :--- |
| `params?` | [CeloTransactionParams](../modules/_utils_celo_transaction_object_.md#celotransactionparams) |

**Returns:** _Promise‹_[_CeloTxReceipt_](../modules/_types_.md#celotxreceipt)_›_

