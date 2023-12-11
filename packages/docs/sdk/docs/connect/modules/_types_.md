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

* [CIP42TXProperties](../interfaces/_types_.cip42txproperties.md)
* [CIP64TXProperties](../interfaces/_types_.cip64txproperties.md)
* [CeloParams](../interfaces/_types_.celoparams.md)
* [CeloTxObject](../interfaces/_types_.celotxobject.md)
* [EIP1559TXProperties](../interfaces/_types_.eip1559txproperties.md)
* [EncodedTransaction](../interfaces/_types_.encodedtransaction.md)
* [Error](../interfaces/_types_.error.md)
* [FormattedCeloTx](../interfaces/_types_.formattedcelotx.md)
* [HttpProvider](../interfaces/_types_.httpprovider.md)
* [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md)
* [JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)
* [LegacyTXProperties](../interfaces/_types_.legacytxproperties.md)
* [Provider](../interfaces/_types_.provider.md)
* [RLPEncodedTx](../interfaces/_types_.rlpencodedtx.md)

### Type aliases

* [AccessListRaw](_types_.md#accesslistraw)
* [Address](_types_.md#address)
* [Callback](_types_.md#callback)
* [CeloTx](_types_.md#celotx)
* [CeloTxPending](_types_.md#celotxpending)
* [CeloTxReceipt](_types_.md#celotxreceipt)
* [CeloTxWithSig](_types_.md#celotxwithsig)
* [Hex](_types_.md#hex)
* [HexOrMissing](_types_.md#hexormissing)
* [TransactionTypes](_types_.md#transactiontypes)

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

###  AccessListRaw

Ƭ **AccessListRaw**: *Array‹[string, string[]]›*

*Defined in [types.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L24)*

___

###  Address

Ƭ **Address**: *string*

*Defined in [types.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L9)*

___

###  Callback

Ƭ **Callback**: *function*

*Defined in [types.ts:124](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L124)*

#### Type declaration:

▸ (`error`: [Error](../interfaces/_types_.error.md) | null, `result?`: T): *void*

**Parameters:**

Name | Type |
------ | ------ |
`error` | [Error](../interfaces/_types_.error.md) &#124; null |
`result?` | T |

___

###  CeloTx

Ƭ **CeloTx**: *TransactionConfig & Partial‹[CeloParams](../interfaces/_types_.celoparams.md)› & object*

*Defined in [types.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L51)*

___

###  CeloTxPending

Ƭ **CeloTxPending**: *Transaction & Partial‹[CeloParams](../interfaces/_types_.celoparams.md)›*

*Defined in [types.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L121)*

___

###  CeloTxReceipt

Ƭ **CeloTxReceipt**: *TransactionReceipt & Partial‹[CeloParams](../interfaces/_types_.celoparams.md)›*

*Defined in [types.ts:122](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L122)*

___

###  CeloTxWithSig

Ƭ **CeloTxWithSig**: *[CeloTx](_types_.md#celotx) & object*

*Defined in [types.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L54)*

___

###  Hex

Ƭ **Hex**: *`0x${string}`*

*Defined in [types.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L11)*

___

###  HexOrMissing

Ƭ **HexOrMissing**: *[Hex](_types_.md#hex) | undefined*

*Defined in [types.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L26)*

___

###  TransactionTypes

Ƭ **TransactionTypes**: *"eip1559" | "celo-legacy" | "cip42" | "cip64"*

*Defined in [types.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L68)*
