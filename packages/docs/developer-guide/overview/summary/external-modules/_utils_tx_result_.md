# utils/tx-result

## Index

### Classes

* [TransactionResult]()

### Functions

* [toTxResult](_utils_tx_result_.md#totxresult)

## Functions

### toTxResult

▸ **toTxResult**\(`pe`: PromiEvent‹any›\): [_TransactionResult_]()_‹›_

_Defined in_ [_contractkit/src/utils/tx-result.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-result.ts#L12)

Transforms a `PromiEvent` to a `TransactionResult`.

PromiEvents are returned by web3 when we do a `contract.method.xxx.send()`

**Parameters:**

| Name | Type |
| :--- | :--- |
| `pe` | PromiEvent‹any› |

**Returns:** [_TransactionResult_]()_‹›_

