# utils/rpc-caller

## Index

### Classes

* [DefaultRpcCaller]()

### Interfaces

* [RpcCaller]()

### Functions

* [getRandomId](_utils_rpc_caller_.md#getrandomid)
* [rpcCallHandler](_utils_rpc_caller_.md#rpccallhandler)

## Functions

### getRandomId

▸ **getRandomId**\(\): _number_

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L36)

**Returns:** _number_

### rpcCallHandler

▸ **rpcCallHandler**\(`payload`: [JsonRpcPayload](), `handler`: function, `callback`: [Callback](_types_.md#callback)‹[JsonRpcResponse]()›\): _void_

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:8_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L8)

**Parameters:**

▪ **payload**: [_JsonRpcPayload_]()

▪ **handler**: _function_

▸ \(`p`: [JsonRpcPayload]()\): _Promise‹any›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `p` | [JsonRpcPayload]() |

▪ **callback**: [_Callback_](_types_.md#callback)_‹_[_JsonRpcResponse_]()_›_

**Returns:** _void_

