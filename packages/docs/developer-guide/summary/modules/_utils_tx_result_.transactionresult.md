# TransactionResult

Replacement interface for web3's `PromiEvent`. Instead of emiting events to signal different stages, eveything is exposed as a promise. Which ends up being nicer when doing promise/async based programming.

## Hierarchy

* **TransactionResult**

## Index

### Constructors

* [constructor]()

### Methods

* [getHash]()
* [waitReceipt]()

## Constructors

### constructor

+ **new TransactionResult**\(`pe`: PromiEvent‹any›\): [_TransactionResult_]()

_Defined in_ [_packages/contractkit/src/utils/tx-result.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-result.ts#L23)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `pe` | PromiEvent‹any› |

**Returns:** [_TransactionResult_]()

## Methods

### getHash

▸ **getHash**\(\): _Promise‹string›_

_Defined in_ [_packages/contractkit/src/utils/tx-result.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-result.ts#L47)

Get \(& wait for\) transaction hash

**Returns:** _Promise‹string›_

### waitReceipt

▸ **waitReceipt**\(\): _Promise‹TransactionReceipt›_

_Defined in_ [_packages/contractkit/src/utils/tx-result.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-result.ts#L59)

Get \(& wait for\) transaction receipt

**Returns:** _Promise‹TransactionReceipt›_

