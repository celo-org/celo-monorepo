[@celo/connect](../README.md) › [Globals](../globals.md) › ["utils/tx-result"](../modules/_utils_tx_result_.md) › [TransactionResult](_utils_tx_result_.transactionresult.md)

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

*Defined in [utils/tx-result.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/tx-result.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`pe` | PromiEvent‹any› |

**Returns:** *[TransactionResult](_utils_tx_result_.transactionresult.md)*

## Methods

###  getHash

▸ **getHash**(): *Promise‹string›*

*Defined in [utils/tx-result.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/tx-result.ts#L45)*

Get (& wait for) transaction hash

**Returns:** *Promise‹string›*

___

###  waitReceipt

▸ **waitReceipt**(): *Promise‹[CeloTxReceipt](../modules/_types_.md#celotxreceipt)›*

*Defined in [utils/tx-result.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/tx-result.ts#L57)*

Get (& wait for) transaction receipt

**Returns:** *Promise‹[CeloTxReceipt](../modules/_types_.md#celotxreceipt)›*
