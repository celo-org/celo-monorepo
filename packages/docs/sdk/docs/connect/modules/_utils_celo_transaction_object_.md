[@celo/connect](../README.md) › [Globals](../globals.md) › ["utils/celo-transaction-object"](_utils_celo_transaction_object_.md)

# Module: "utils/celo-transaction-object"

## Index

### Classes

* [CeloTransactionObject](../classes/_utils_celo_transaction_object_.celotransactionobject.md)

### Type aliases

* [CeloTransactionParams](_utils_celo_transaction_object_.md#celotransactionparams)

### Functions

* [toTransactionObject](_utils_celo_transaction_object_.md#totransactionobject)

## Type aliases

###  CeloTransactionParams

Ƭ **CeloTransactionParams**: *Omit‹[CeloTx](_types_.md#celotx), "data"›*

*Defined in [utils/celo-transaction-object.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L5)*

## Functions

###  toTransactionObject

▸ **toTransactionObject**<**O**>(`connection`: [Connection](../classes/_connection_.connection.md), `txo`: [CeloTxObject](../interfaces/_types_.celotxobject.md)‹O›, `defaultParams?`: [CeloTransactionParams](_utils_celo_transaction_object_.md#celotransactionparams)): *[CeloTransactionObject](../classes/_utils_celo_transaction_object_.celotransactionobject.md)‹O›*

*Defined in [utils/celo-transaction-object.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L7)*

**Type parameters:**

▪ **O**

**Parameters:**

Name | Type |
------ | ------ |
`connection` | [Connection](../classes/_connection_.connection.md) |
`txo` | [CeloTxObject](../interfaces/_types_.celotxobject.md)‹O› |
`defaultParams?` | [CeloTransactionParams](_utils_celo_transaction_object_.md#celotransactionparams) |

**Returns:** *[CeloTransactionObject](../classes/_utils_celo_transaction_object_.celotransactionobject.md)‹O›*
