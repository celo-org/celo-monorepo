# Interface: RpcCaller

## Hierarchy

* **RpcCaller**

## Implemented by

* [DefaultRpcCaller](../classes/_utils_rpc_caller_.defaultrpccaller.md)

## Index

### Properties

* [call](_utils_rpc_caller_.rpccaller.md#call)
* [send](_utils_rpc_caller_.rpccaller.md#send)

## Properties

###  call

• **call**: *function*

*Defined in [contractkit/src/utils/rpc-caller.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L65)*

#### Type declaration:

▸ (`method`: string, `params`: any[]): *Promise‹JsonRpcResponse›*

**Parameters:**

Name | Type |
------ | ------ |
`method` | string |
`params` | any[] |

___

###  send

• **send**: *function*

*Defined in [contractkit/src/utils/rpc-caller.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L66)*

#### Type declaration:

▸ (`payload`: JsonRpcPayload, `callback`: Callback‹JsonRpcResponse›): *void*

**Parameters:**

Name | Type |
------ | ------ |
`payload` | JsonRpcPayload |
`callback` | Callback‹JsonRpcResponse› |
