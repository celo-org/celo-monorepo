[@celo/connect](../README.md) › [Globals](../globals.md) › ["utils/rpc-caller"](../modules/_utils_rpc_caller_.md) › [HttpRpcCaller](_utils_rpc_caller_.httprpccaller.md)

# Class: HttpRpcCaller

## Hierarchy

* **HttpRpcCaller**

## Implements

* [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md)

## Index

### Constructors

* [constructor](_utils_rpc_caller_.httprpccaller.md#constructor)

### Properties

* [httpProvider](_utils_rpc_caller_.httprpccaller.md#readonly-httpprovider)
* [jsonrpcVersion](_utils_rpc_caller_.httprpccaller.md#readonly-jsonrpcversion)

### Methods

* [call](_utils_rpc_caller_.httprpccaller.md#call)
* [send](_utils_rpc_caller_.httprpccaller.md#send)

## Constructors

###  constructor

\+ **new HttpRpcCaller**(`httpProvider`: [HttpProvider](../interfaces/_types_.httpprovider.md), `jsonrpcVersion`: string): *[HttpRpcCaller](_utils_rpc_caller_.httprpccaller.md)*

*Defined in [utils/rpc-caller.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L71)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`httpProvider` | [HttpProvider](../interfaces/_types_.httpprovider.md) | - |
`jsonrpcVersion` | string | "2.0" |

**Returns:** *[HttpRpcCaller](_utils_rpc_caller_.httprpccaller.md)*

## Properties

### `Readonly` httpProvider

• **httpProvider**: *[HttpProvider](../interfaces/_types_.httpprovider.md)*

*Defined in [utils/rpc-caller.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L72)*

___

### `Readonly` jsonrpcVersion

• **jsonrpcVersion**: *string*

*Defined in [utils/rpc-caller.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L72)*

## Methods

###  call

▸ **call**(`method`: string, `params`: any[]): *Promise‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)›*

*Defined in [utils/rpc-caller.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`method` | string |
`params` | any[] |

**Returns:** *Promise‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)›*

___

###  send

▸ **send**(`payload`: [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md), `callback`: function): *void*

*Defined in [utils/rpc-caller.ts:92](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L92)*

**Parameters:**

▪ **payload**: *[JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md)*

▪ **callback**: *function*

▸ (`error`: [Error](../interfaces/_types_.error.md) | null, `result?`: [JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`error` | [Error](../interfaces/_types_.error.md) &#124; null |
`result?` | [JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md) |

**Returns:** *void*
