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

+ **new CeloTransactionObject**\(`kit`: [ContractKit](), `txo`: TransactionObject‹O›, `defaultParams?`: [CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams)\): [_CeloTransactionObject_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:242_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L242)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `txo` | TransactionObject‹O› |
| `defaultParams?` | [CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams) |

**Returns:** [_CeloTransactionObject_]()

## Properties

### `Optional` defaultParams

• **defaultParams**? : [_CeloTransactionParams_](_wrappers_basewrapper_.md#celotransactionparams)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:246_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L246)

### txo

• **txo**: _TransactionObject‹O›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:245_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L245)

## Methods

### send

▸ **send**\(`params?`: [CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams)\): _Promise‹_[_TransactionResult_]()_›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:250_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L250)

send the transaction to the chain

**Parameters:**

| Name | Type |
| :--- | :--- |
| `params?` | [CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams) |

**Returns:** _Promise‹_[_TransactionResult_]()_›_

### sendAndWaitForReceipt

▸ **sendAndWaitForReceipt**\(`params?`: [CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams)\): _Promise‹TransactionReceipt›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:255_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L255)

send the transaction and waits for the receipt

**Parameters:**

| Name | Type |
| :--- | :--- |
| `params?` | [CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams) |

**Returns:** _Promise‹TransactionReceipt›_

