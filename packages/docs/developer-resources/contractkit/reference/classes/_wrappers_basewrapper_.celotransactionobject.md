# Class: CeloTransactionObject <**O**>

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

###  constructor

\+ **new CeloTransactionObject**(`kit`: [ContractKit](_kit_.contractkit.md), `txo`: TransactionObject‹O›, `defaultParams?`: [CeloTransactionParams](../modules/_wrappers_basewrapper_.md#celotransactionparams)): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:240](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L240)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`txo` | TransactionObject‹O› |
`defaultParams?` | [CeloTransactionParams](../modules/_wrappers_basewrapper_.md#celotransactionparams) |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)*

## Properties

### `Optional` defaultParams

• **defaultParams**? : *[CeloTransactionParams](../modules/_wrappers_basewrapper_.md#celotransactionparams)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:244](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L244)*

___

###  txo

• **txo**: *TransactionObject‹O›*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L243)*

## Methods

###  send

▸ **send**(`params?`: [CeloTransactionParams](../modules/_wrappers_basewrapper_.md#celotransactionparams)): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:248](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L248)*

send the transaction to the chain

**Parameters:**

Name | Type |
------ | ------ |
`params?` | [CeloTransactionParams](../modules/_wrappers_basewrapper_.md#celotransactionparams) |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  sendAndWaitForReceipt

▸ **sendAndWaitForReceipt**(`params?`: [CeloTransactionParams](../modules/_wrappers_basewrapper_.md#celotransactionparams)): *Promise‹TransactionReceipt›*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:253](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L253)*

send the transaction and waits for the receipt

**Parameters:**

Name | Type |
------ | ------ |
`params?` | [CeloTransactionParams](../modules/_wrappers_basewrapper_.md#celotransactionparams) |

**Returns:** *Promise‹TransactionReceipt›*
