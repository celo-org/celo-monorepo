[@celo/connect](../README.md) › [Globals](../globals.md) › ["types"](_types_.md)

# Module: "types"

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

* [CeloParams](../interfaces/_types_.celoparams.md)
* [CeloTxObject](../interfaces/_types_.celotxobject.md)
* [EncodedTransaction](../interfaces/_types_.encodedtransaction.md)
* [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md)
* [JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)
* [Provider](../interfaces/_types_.provider.md)
* [RLPEncodedTx](../interfaces/_types_.rlpencodedtx.md)

### Type aliases

* [Address](_types_.md#address)
* [Callback](_types_.md#callback)
* [CeloTx](_types_.md#celotx)
* [CeloTxPending](_types_.md#celotxpending)
* [CeloTxReceipt](_types_.md#celotxreceipt)

## References

###  Block

• **Block**:

___

###  BlockHeader

• **BlockHeader**:

___

###  BlockNumber

• **BlockNumber**:

___

###  Contract

• **Contract**:

___

###  ContractSendMethod

• **ContractSendMethod**:

___

###  EventLog

• **EventLog**:

___

###  Log

• **Log**:

___

###  PastEventOptions

• **PastEventOptions**:

___

###  PromiEvent

• **PromiEvent**:

___

###  Sign

• **Sign**:

___

###  Syncing

• **Syncing**:

## Type aliases

###  Address

Ƭ **Address**: *string*

*Defined in [types.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L4)*

___

###  Callback

Ƭ **Callback**: *function*

*Defined in [types.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L49)*

#### Type declaration:

▸ (`error`: Error | null, `result?`: T): *void*

**Parameters:**

Name | Type |
------ | ------ |
`error` | Error &#124; null |
`result?` | T |

___

###  CeloTx

Ƭ **CeloTx**: *TransactionConfig & Partial‹[CeloParams](../interfaces/_types_.celoparams.md)›*

*Defined in [types.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L12)*

___

###  CeloTxPending

Ƭ **CeloTxPending**: *Transaction & Partial‹[CeloParams](../interfaces/_types_.celoparams.md)›*

*Defined in [types.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L46)*

___

###  CeloTxReceipt

Ƭ **CeloTxReceipt**: *TransactionReceipt & Partial‹[CeloParams](../interfaces/_types_.celoparams.md)›*

*Defined in [types.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L47)*
