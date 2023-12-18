[@celo/connect](../README.md) › [Globals](../globals.md) › ["utils/celo-transaction-object"](../modules/_utils_celo_transaction_object_.md) › [CeloTransactionObject](_utils_celo_transaction_object_.celotransactionobject.md)

# Class: CeloTransactionObject <**O**>

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

###  constructor

\+ **new CeloTransactionObject**(`connection`: [Connection](_connection_.connection.md), `txo`: [CeloTxObject](../interfaces/_types_.celotxobject.md)‹O›, `defaultParams?`: [CeloTransactionParams](../modules/_utils_celo_transaction_object_.md#celotransactionparams)): *[CeloTransactionObject](_utils_celo_transaction_object_.celotransactionobject.md)*

*Defined in [utils/celo-transaction-object.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | [Connection](_connection_.connection.md) |
`txo` | [CeloTxObject](../interfaces/_types_.celotxobject.md)‹O› |
`defaultParams?` | [CeloTransactionParams](../modules/_utils_celo_transaction_object_.md#celotransactionparams) |

**Returns:** *[CeloTransactionObject](_utils_celo_transaction_object_.celotransactionobject.md)*

## Properties

### `Optional` `Readonly` defaultParams

• **defaultParams**? : *[CeloTransactionParams](../modules/_utils_celo_transaction_object_.md#celotransactionparams)*

*Defined in [utils/celo-transaction-object.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L19)*

___

### `Readonly` txo

• **txo**: *[CeloTxObject](../interfaces/_types_.celotxobject.md)‹O›*

*Defined in [utils/celo-transaction-object.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L18)*

## Methods

###  send

▸ **send**(`params?`: [CeloTransactionParams](../modules/_utils_celo_transaction_object_.md#celotransactionparams)): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [utils/celo-transaction-object.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L23)*

send the transaction to the chain

**Parameters:**

Name | Type |
------ | ------ |
`params?` | [CeloTransactionParams](../modules/_utils_celo_transaction_object_.md#celotransactionparams) |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  sendAndWaitForReceipt

▸ **sendAndWaitForReceipt**(`params?`: [CeloTransactionParams](../modules/_utils_celo_transaction_object_.md#celotransactionparams)): *Promise‹[CeloTxReceipt](../modules/_types_.md#celotxreceipt)›*

*Defined in [utils/celo-transaction-object.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/celo-transaction-object.ts#L28)*

send the transaction and waits for the receipt

**Parameters:**

Name | Type |
------ | ------ |
`params?` | [CeloTransactionParams](../modules/_utils_celo_transaction_object_.md#celotransactionparams) |

**Returns:** *Promise‹[CeloTxReceipt](../modules/_types_.md#celotxreceipt)›*
