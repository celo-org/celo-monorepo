# TransactionResult

Replacement interface for web3's `PromiEvent`. Instead of emiting events to signal different stages, eveything is exposed as a promise. Which ends up being nicer when doing promise/async based programming.

## Hierarchy

* **TransactionResult**

## Index

### Constructors

* [constructor](_utils_tx_result_.transactionresult.md#constructor)

### Methods

* [getHash](_utils_tx_result_.transactionresult.md#gethash)
* [waitReceipt](_utils_tx_result_.transactionresult.md#waitreceipt)

## Constructors

### constructor

+ **new TransactionResult**\(`pe`: PromiEvent‹any›\): [_TransactionResult_](_utils_tx_result_.transactionresult.md)

_Defined in_ [_packages/sdk/connect/src/utils/tx-result.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/tx-result.ts#L21)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `pe` | PromiEvent‹any› |

**Returns:** [_TransactionResult_](_utils_tx_result_.transactionresult.md)

## Methods

### getHash

▸ **getHash**\(\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/utils/tx-result.ts:45_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/tx-result.ts#L45)

Get \(& wait for\) transaction hash

**Returns:** _Promise‹string›_

### waitReceipt

▸ **waitReceipt**\(\): _Promise‹_[_CeloTxReceipt_](../modules/_types_.md#celotxreceipt)_›_

_Defined in_ [_packages/sdk/connect/src/utils/tx-result.ts:57_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/tx-result.ts#L57)

Get \(& wait for\) transaction receipt

**Returns:** _Promise‹_[_CeloTxReceipt_](../modules/_types_.md#celotxreceipt)_›_

