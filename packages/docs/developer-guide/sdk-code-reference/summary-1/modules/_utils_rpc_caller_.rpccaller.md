# RpcCaller

## Hierarchy

* **RpcCaller**

## Implemented by

* [DefaultRpcCaller]()

## Index

### Properties

* [call]()
* [send]()

## Properties

### call

• **call**: _function_

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:64_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L64)

#### Type declaration:

▸ \(`method`: string, `params`: any\[\]\): _Promise‹_[_JsonRpcResponse_]()_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `method` | string |
| `params` | any\[\] |

### send

• **send**: _function_

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L65)

#### Type declaration:

▸ \(`payload`: [JsonRpcPayload](), `callback`: [Callback](_types_.md#callback)‹[JsonRpcResponse]()›\): _void_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `payload` | [JsonRpcPayload]() |
| `callback` | [Callback](_types_.md#callback)‹[JsonRpcResponse]()› |

