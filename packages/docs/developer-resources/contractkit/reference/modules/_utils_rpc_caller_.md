# External module: "utils/rpc-caller"

## Index

### Classes

* [DefaultRpcCaller](../classes/_utils_rpc_caller_.defaultrpccaller.md)

### Interfaces

* [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md)

### Functions

* [getRandomId](_utils_rpc_caller_.md#getrandomid)
* [rpcCallHandler](_utils_rpc_caller_.md#rpccallhandler)

## Functions

###  getRandomId

▸ **getRandomId**(): *number*

*Defined in [contractkit/src/utils/rpc-caller.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L37)*

**Returns:** *number*

___

###  rpcCallHandler

▸ **rpcCallHandler**(`payload`: JsonRpcPayload, `handler`: function, `callback`: Callback‹JsonRpcResponse›): *void*

*Defined in [contractkit/src/utils/rpc-caller.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L9)*

**Parameters:**

▪ **payload**: *JsonRpcPayload*

▪ **handler**: *function*

▸ (`p`: JsonRpcPayload): *Promise‹any›*

**Parameters:**

Name | Type |
------ | ------ |
`p` | JsonRpcPayload |

▪ **callback**: *Callback‹JsonRpcResponse›*

**Returns:** *void*
