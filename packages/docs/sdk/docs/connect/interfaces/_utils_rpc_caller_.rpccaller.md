[@celo/connect](../README.md) › [Globals](../globals.md) › ["utils/rpc-caller"](../modules/_utils_rpc_caller_.md) › [RpcCaller](_utils_rpc_caller_.rpccaller.md)

# Interface: RpcCaller

## Hierarchy

* **RpcCaller**

## Implemented by

* [HttpRpcCaller](../classes/_utils_rpc_caller_.httprpccaller.md)

## Index

### Properties

* [call](_utils_rpc_caller_.rpccaller.md#call)
* [send](_utils_rpc_caller_.rpccaller.md#send)

## Properties

###  call

• **call**: *function*

*Defined in [utils/rpc-caller.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L64)*

#### Type declaration:

▸ (`method`: string, `params`: any[]): *Promise‹[JsonRpcResponse](_types_.jsonrpcresponse.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`method` | string |
`params` | any[] |

___

###  send

• **send**: *function*

*Defined in [utils/rpc-caller.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L65)*

#### Type declaration:

▸ (`payload`: [JsonRpcPayload](_types_.jsonrpcpayload.md), `callback`: function): *void*

**Parameters:**

▪ **payload**: *[JsonRpcPayload](_types_.jsonrpcpayload.md)*

▪ **callback**: *function*

▸ (`error`: [Error](_types_.error.md) | null, `result?`: [JsonRpcResponse](_types_.jsonrpcresponse.md)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`error` | [Error](_types_.error.md) &#124; null |
`result?` | [JsonRpcResponse](_types_.jsonrpcresponse.md) |
