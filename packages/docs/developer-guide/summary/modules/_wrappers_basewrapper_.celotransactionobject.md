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

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:321_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L321)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `txo` | TransactionObject‹O› |
| `defaultParams?` | [CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams) |

**Returns:** [_CeloTransactionObject_]()

## Properties

### `Optional` `Readonly` defaultParams

• **defaultParams**? : [_CeloTransactionParams_](_wrappers_basewrapper_.md#celotransactionparams)

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:325_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L325)

### `Readonly` txo

• **txo**: _TransactionObject‹O›_

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:324_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L324)

## Methods

### send

▸ **send**\(`params?`: Partial‹[CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams)›\): _Promise‹_[_TransactionResult_]()_›_

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:329_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L329)

send the transaction to the chain

**Parameters:**

| Name | Type |
| :--- | :--- |
| `params?` | Partial‹[CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams)› |

**Returns:** _Promise‹_[_TransactionResult_]()_›_

### sendAndWaitForReceipt

▸ **sendAndWaitForReceipt**\(`params?`: Partial‹[CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams)›\): _Promise‹TransactionReceipt›_

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:334_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L334)

send the transaction and waits for the receipt

**Parameters:**

| Name | Type |
| :--- | :--- |
| `params?` | Partial‹[CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams)› |

**Returns:** _Promise‹TransactionReceipt›_

