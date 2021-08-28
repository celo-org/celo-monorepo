# types

## Index

### References

* [Block](_types_.md#block)
* [BlockHeader](_types_.md#blockheader)
* [BlockNumber](_types_.md#blocknumber)
* [Contract](_types_.md#contract)
* [ContractSendMethod](_types_.md#contractsendmethod)
* [EventLog](_types_.md#eventlog)
* [Log](_types_.md#log)
* [PastEventOptions](_types_.md#pasteventoptions)
* [PromiEvent](_types_.md#promievent)
* [Sign](_types_.md#sign)
* [Syncing](_types_.md#syncing)

### Interfaces

* [CeloParams]()
* [CeloTxObject]()
* [EncodedTransaction]()
* [JsonRpcPayload]()
* [JsonRpcResponse]()
* [Provider]()
* [RLPEncodedTx]()

### Type aliases

* [Address](_types_.md#address)
* [Callback](_types_.md#callback)
* [CeloTx](_types_.md#celotx)
* [CeloTxPending](_types_.md#celotxpending)
* [CeloTxReceipt](_types_.md#celotxreceipt)

## References

### Block

• **Block**:

### BlockHeader

• **BlockHeader**:

### BlockNumber

• **BlockNumber**:

### Contract

• **Contract**:

### ContractSendMethod

• **ContractSendMethod**:

### EventLog

• **EventLog**:

### Log

• **Log**:

### PastEventOptions

• **PastEventOptions**:

### PromiEvent

• **PromiEvent**:

### Sign

• **Sign**:

### Syncing

• **Syncing**:

## Type aliases

### Address

Ƭ **Address**: _string_

_Defined in_ [_packages/sdk/connect/src/types.ts:4_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L4)

### Callback

Ƭ **Callback**: _function_

_Defined in_ [_packages/sdk/connect/src/types.ts:49_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L49)

#### Type declaration:

▸ \(`error`: Error \| null, `result?`: T\): _void_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `error` | Error \| null |
| `result?` | T |

### CeloTx

Ƭ **CeloTx**: _TransactionConfig & Partial‹_[_CeloParams_]()_›_

_Defined in_ [_packages/sdk/connect/src/types.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L12)

### CeloTxPending

Ƭ **CeloTxPending**: _Transaction & Partial‹_[_CeloParams_]()_›_

_Defined in_ [_packages/sdk/connect/src/types.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L46)

### CeloTxReceipt

Ƭ **CeloTxReceipt**: _TransactionReceipt & Partial‹_[_CeloParams_]()_›_

_Defined in_ [_packages/sdk/connect/src/types.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L47)

