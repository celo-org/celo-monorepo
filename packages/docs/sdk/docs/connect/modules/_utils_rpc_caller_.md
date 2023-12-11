[@celo/connect](../README.md) › [Globals](../globals.md) › ["utils/rpc-caller"](_utils_rpc_caller_.md)

# Module: "utils/rpc-caller"

## Index

### Classes

* [HttpRpcCaller](../classes/_utils_rpc_caller_.httprpccaller.md)

### Interfaces

* [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md)

### Functions

* [getRandomId](_utils_rpc_caller_.md#getrandomid)
* [rpcCallHandler](_utils_rpc_caller_.md#rpccallhandler)

## Functions

###  getRandomId

▸ **getRandomId**(): *number*

*Defined in [utils/rpc-caller.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L36)*

**Returns:** *number*

___

###  rpcCallHandler

▸ **rpcCallHandler**(`payload`: [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md), `handler`: function, `callback`: [Callback](_types_.md#callback)‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)›): *[rpcCallHandler](_utils_rpc_caller_.md#rpccallhandler)*

*Defined in [utils/rpc-caller.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L8)*

**Parameters:**

▪ **payload**: *[JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md)*

▪ **handler**: *function*

▸ (`p`: [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md)): *Promise‹any›*

**Parameters:**

Name | Type |
------ | ------ |
`p` | [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md) |

▪ **callback**: *[Callback](_types_.md#callback)‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)›*

**Returns:** *[rpcCallHandler](_utils_rpc_caller_.md#rpccallhandler)*
