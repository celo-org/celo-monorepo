# CeloTransactionObject

## Type parameters

▪ **O**

## Hierarchy

* **CeloTransactionObject**

## Index

### Constructors

* [constructor](_wrappers_basewrapper_.celotransactionobject.md#constructor)

### Properties

* [defaultParams](_wrappers_basewrapper_.celotransactionobject.md#optional-defaultparams)
* [txo](_wrappers_basewrapper_.celotransactionobject.md#txo)

### Methods

* [send](_wrappers_basewrapper_.celotransactionobject.md#send)
* [sendAndWaitForReceipt](_wrappers_basewrapper_.celotransactionobject.md#sendandwaitforreceipt)

## Constructors

### constructor

+ **new CeloTransactionObject**\(`kit`: [ContractKit](_kit_.contractkit.md), `txo`: TransactionObject‹O›, `defaultParams?`: [CeloTransactionParams](../external-modules/_wrappers_basewrapper_.md#celotransactionparams)\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:242_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L242)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `txo` | TransactionObject‹O› |
| `defaultParams?` | [CeloTransactionParams](../external-modules/_wrappers_basewrapper_.md#celotransactionparams) |

**Returns:** [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)

## Properties

### `Optional` defaultParams

• **defaultParams**? : [_CeloTransactionParams_](../external-modules/_wrappers_basewrapper_.md#celotransactionparams)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:246_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L246)

### txo

• **txo**: _TransactionObject‹O›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:245_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L245)

## Methods

### send

▸ **send**\(`params?`: [CeloTransactionParams](../external-modules/_wrappers_basewrapper_.md#celotransactionparams)\): _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:250_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L250)

send the transaction to the chain

**Parameters:**

| Name | Type |
| :--- | :--- |
| `params?` | [CeloTransactionParams](../external-modules/_wrappers_basewrapper_.md#celotransactionparams) |

**Returns:** _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

### sendAndWaitForReceipt

▸ **sendAndWaitForReceipt**\(`params?`: [CeloTransactionParams](../external-modules/_wrappers_basewrapper_.md#celotransactionparams)\): _Promise‹TransactionReceipt›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:255_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L255)

send the transaction and waits for the receipt

**Parameters:**

| Name | Type |
| :--- | :--- |
| `params?` | [CeloTransactionParams](../external-modules/_wrappers_basewrapper_.md#celotransactionparams) |

**Returns:** _Promise‹TransactionReceipt›_

