# RpcCaller

## Hierarchy

* **RpcCaller**

## Implemented by

* [DefaultRpcCaller](../classes/_utils_rpc_caller_.defaultrpccaller.md)

## Index

### Properties

* [call](_utils_rpc_caller_.rpccaller.md#call)
* [send](_utils_rpc_caller_.rpccaller.md#send)

## Properties

### call

• **call**: _function_

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:64_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L64)

#### Type declaration:

▸ \(`method`: string, `params`: any\[\]\): _Promise‹_[_JsonRpcResponse_](_types_.jsonrpcresponse.md)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `method` | string |
| `params` | any\[\] |

### send

• **send**: _function_

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L65)

#### Type declaration:

▸ \(`payload`: [JsonRpcPayload](_types_.jsonrpcpayload.md), `callback`: [Callback](../modules/_types_.md#callback)‹[JsonRpcResponse](_types_.jsonrpcresponse.md)›\): _void_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `payload` | [JsonRpcPayload](_types_.jsonrpcpayload.md) |
| `callback` | [Callback](../modules/_types_.md#callback)‹[JsonRpcResponse](_types_.jsonrpcresponse.md)› |

