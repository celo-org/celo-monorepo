[@celo/connect](../README.md) › [Globals](../globals.md) › ["utils/rpc-caller"](../modules/_utils_rpc_caller_.md) › [DefaultRpcCaller](_utils_rpc_caller_.defaultrpccaller.md)

# Class: DefaultRpcCaller

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

###  constructor

\+ **new DefaultRpcCaller**(`defaultProvider`: [Provider](../interfaces/_types_.provider.md), `jsonrpcVersion`: string): *[DefaultRpcCaller](_utils_rpc_caller_.defaultrpccaller.md)*

*Defined in [utils/rpc-caller.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L67)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`defaultProvider` | [Provider](../interfaces/_types_.provider.md) | - |
`jsonrpcVersion` | string | "2.0" |

**Returns:** *[DefaultRpcCaller](_utils_rpc_caller_.defaultrpccaller.md)*

## Properties

### `Readonly` defaultProvider

• **defaultProvider**: *[Provider](../interfaces/_types_.provider.md)*

*Defined in [utils/rpc-caller.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L68)*

___

### `Readonly` jsonrpcVersion

• **jsonrpcVersion**: *string*

*Defined in [utils/rpc-caller.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L68)*

## Methods

###  call

▸ **call**(`method`: string, `params`: any[]): *Promise‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)›*

*Defined in [utils/rpc-caller.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`method` | string |
`params` | any[] |

**Returns:** *Promise‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)›*

___

###  send

▸ **send**(`payload`: [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md), `callback`: [Callback](../modules/_types_.md#callback)‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)›): *void*

*Defined in [utils/rpc-caller.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`payload` | [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md) |
`callback` | [Callback](../modules/_types_.md#callback)‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)› |

**Returns:** *void*
