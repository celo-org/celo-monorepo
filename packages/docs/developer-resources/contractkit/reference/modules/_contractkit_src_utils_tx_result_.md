# External module: "contractkit/src/utils/tx-result"

## Index

### Classes

* [TransactionResult](../classes/_contractkit_src_utils_tx_result_.transactionresult.md)

### Functions

* [toTxResult](_contractkit_src_utils_tx_result_.md#totxresult)

## Functions

###  toTxResult

▸ **toTxResult**(`pe`: PromiEvent‹any›): *[TransactionResult](../classes/_contractkit_src_utils_tx_result_.transactionresult.md)‹›*

*Defined in [contractkit/src/utils/tx-result.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-result.ts#L12)*

Transforms a `PromiEvent` to a `TransactionResult`.

PromiEvents are returned by web3 when we do a `contract.method.xxx.send()`

**Parameters:**

Name | Type |
------ | ------ |
`pe` | PromiEvent‹any› |

**Returns:** *[TransactionResult](../classes/_contractkit_src_utils_tx_result_.transactionresult.md)‹›*
