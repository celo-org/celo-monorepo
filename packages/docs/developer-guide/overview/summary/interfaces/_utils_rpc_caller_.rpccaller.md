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

_Defined in_ [_contractkit/src/utils/rpc-caller.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L65)

#### Type declaration:

▸ \(`method`: string, `params`: any\[\]\): _Promise‹JsonRpcResponse›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `method` | string |
| `params` | any\[\] |

### send

• **send**: _function_

_Defined in_ [_contractkit/src/utils/rpc-caller.ts:66_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L66)

#### Type declaration:

▸ \(`payload`: JsonRpcPayload, `callback`: Callback‹JsonRpcResponse›\): _void_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `payload` | JsonRpcPayload |
| `callback` | Callback‹JsonRpcResponse› |

