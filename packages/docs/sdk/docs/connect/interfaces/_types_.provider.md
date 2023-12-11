[@celo/connect](../README.md) › [Globals](../globals.md) › ["types"](../modules/_types_.md) › [Provider](_types_.provider.md)

# Interface: Provider

## Hierarchy

* **Provider**

## Implemented by

* [CeloProvider](../classes/_celo_provider_.celoprovider.md)

## Index

### Methods

* [send](_types_.provider.md#send)

## Methods

###  send

▸ **send**(`payload`: [JsonRpcPayload](_types_.jsonrpcpayload.md), `callback`: function): *void*

*Defined in [types.ts:145](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L145)*

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
