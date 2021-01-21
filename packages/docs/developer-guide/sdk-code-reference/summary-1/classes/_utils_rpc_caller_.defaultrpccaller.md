# DefaultRpcCaller

## Hierarchy

* **DefaultRpcCaller**

## Implements

* [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md)

## Index

### Constructors

* [constructor](_utils_rpc_caller_.defaultrpccaller.md#constructor)

### Properties

* [defaultProvider](_utils_rpc_caller_.defaultrpccaller.md#readonly-defaultprovider)
* [jsonrpcVersion](_utils_rpc_caller_.defaultrpccaller.md#readonly-jsonrpcversion)

### Methods

* [call](_utils_rpc_caller_.defaultrpccaller.md#call)
* [send](_utils_rpc_caller_.defaultrpccaller.md#send)

## Constructors

### constructor

+ **new DefaultRpcCaller**\(`defaultProvider`: [Provider](../interfaces/_types_.provider.md), `jsonrpcVersion`: string\): [_DefaultRpcCaller_](_utils_rpc_caller_.defaultrpccaller.md)

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:67_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L67)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `defaultProvider` | [Provider](../interfaces/_types_.provider.md) | - |
| `jsonrpcVersion` | string | "2.0" |

**Returns:** [_DefaultRpcCaller_](_utils_rpc_caller_.defaultrpccaller.md)

## Properties

### `Readonly` defaultProvider

• **defaultProvider**: [_Provider_](../interfaces/_types_.provider.md)

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L68)

### `Readonly` jsonrpcVersion

• **jsonrpcVersion**: _string_

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L68)

## Methods

### call

▸ **call**\(`method`: string, `params`: any\[\]\): _Promise‹_[_JsonRpcResponse_](../interfaces/_types_.jsonrpcresponse.md)_›_

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L70)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `method` | string |
| `params` | any\[\] |

**Returns:** _Promise‹_[_JsonRpcResponse_](../interfaces/_types_.jsonrpcresponse.md)_›_

### send

▸ **send**\(`payload`: [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md), `callback`: [Callback](../modules/_types_.md#callback)‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)›\): _void_

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:88_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L88)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `payload` | [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md) |
| `callback` | [Callback](../modules/_types_.md#callback)‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)› |

**Returns:** _void_

