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

*Defined in [contractkit/src/utils/rpc-caller.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L36)*

**Returns:** *number*

___

###  rpcCallHandler

▸ **rpcCallHandler**(`payload`: JsonRPCRequest, `handler`: function, `callback`: Callback‹JsonRPCResponse›): *void*

*Defined in [contractkit/src/utils/rpc-caller.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L8)*

**Parameters:**

▪ **payload**: *JsonRPCRequest*

▪ **handler**: *function*

▸ (`p`: JsonRPCRequest): *Promise‹any›*

**Parameters:**

Name | Type |
------ | ------ |
`p` | JsonRPCRequest |

▪ **callback**: *Callback‹JsonRPCResponse›*

**Returns:** *void*
