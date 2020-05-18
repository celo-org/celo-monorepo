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

_Defined in_ [_contractkit/src/utils/rpc-caller.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L37)

**Returns:** _number_

### rpcCallHandler

▸ **rpcCallHandler**\(`payload`: JsonRpcPayload, `handler`: function, `callback`: Callback‹JsonRpcResponse›\): _void_

_Defined in_ [_contractkit/src/utils/rpc-caller.ts:9_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L9)

**Parameters:**

▪ **payload**: _JsonRpcPayload_

▪ **handler**: _function_

▸ \(`p`: JsonRpcPayload\): _Promise‹any›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `p` | JsonRpcPayload |

▪ **callback**: _Callback‹JsonRpcResponse›_

**Returns:** _void_

