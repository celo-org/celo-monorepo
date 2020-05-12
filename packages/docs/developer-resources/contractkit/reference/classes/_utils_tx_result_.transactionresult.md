# Class: TransactionResult

Replacement interface for web3's `PromiEvent`. Instead of emiting events
to signal different stages, eveything is exposed as a promise. Which ends
up being nicer when doing promise/async based programming.

## Hierarchy

* **TransactionResult**

## Index

### Constructors

* [constructor](_utils_tx_result_.transactionresult.md#constructor)

### Methods

* [getHash](_utils_tx_result_.transactionresult.md#gethash)
* [waitReceipt](_utils_tx_result_.transactionresult.md#waitreceipt)

## Constructors

###  constructor

\+ **new TransactionResult**(`pe`: PromiEvent‹any›): *[TransactionResult](_utils_tx_result_.transactionresult.md)*

*Defined in [contractkit/src/utils/tx-result.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-result.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`pe` | PromiEvent‹any› |

**Returns:** *[TransactionResult](_utils_tx_result_.transactionresult.md)*

## Methods

###  getHash

▸ **getHash**(): *Promise‹string›*

*Defined in [contractkit/src/utils/tx-result.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-result.ts#L47)*

Get (& wait for) transaction hash

**Returns:** *Promise‹string›*

___

###  waitReceipt

▸ **waitReceipt**(): *Promise‹TransactionReceipt›*

*Defined in [contractkit/src/utils/tx-result.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-result.ts#L59)*

Get (& wait for) transaction receipt

**Returns:** *Promise‹TransactionReceipt›*
