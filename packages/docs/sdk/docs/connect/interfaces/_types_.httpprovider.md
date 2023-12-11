[@celo/connect](../README.md) › [Globals](../globals.md) › ["types"](../modules/_types_.md) › [HttpProvider](_types_.httpprovider.md)

# Interface: HttpProvider

## Hierarchy

* **HttpProvider**

## Index

### Methods

* [send](_types_.httpprovider.md#send)

## Methods

###  send

▸ **send**(`payload`: [JsonRpcPayload](_types_.jsonrpcpayload.md), `callback`: function): *void*

*Defined in [types.ts:158](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L158)*

**Parameters:**

▪ **payload**: *[JsonRpcPayload](_types_.jsonrpcpayload.md)*

▪ **callback**: *function*

▸ (`error`: [Error](_types_.error.md) | null, `result?`: [JsonRpcResponse](_types_.jsonrpcresponse.md)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`error` | [Error](_types_.error.md) &#124; null |
`result?` | [JsonRpcResponse](_types_.jsonrpcresponse.md) |

**Returns:** *void*
