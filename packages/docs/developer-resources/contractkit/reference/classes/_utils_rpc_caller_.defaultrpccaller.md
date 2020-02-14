# Class: DefaultRpcCaller

## Hierarchy

* **DefaultRpcCaller**

## Implements

* [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md)

## Index

### Constructors

* [constructor](_utils_rpc_caller_.defaultrpccaller.md#constructor)

### Properties

* [jsonrpcVersion](_utils_rpc_caller_.defaultrpccaller.md#jsonrpcversion)
* [provider](_utils_rpc_caller_.defaultrpccaller.md#provider)

### Methods

* [call](_utils_rpc_caller_.defaultrpccaller.md#call)
* [send](_utils_rpc_caller_.defaultrpccaller.md#send)

## Constructors

###  constructor

\+ **new DefaultRpcCaller**(`provider`: Provider, `jsonrpcVersion`: string): *[DefaultRpcCaller](_utils_rpc_caller_.defaultrpccaller.md)*

*Defined in [contractkit/src/utils/rpc-caller.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L67)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`provider` | Provider | - |
`jsonrpcVersion` | string | "2.0" |

**Returns:** *[DefaultRpcCaller](_utils_rpc_caller_.defaultrpccaller.md)*

## Properties

###  jsonrpcVersion

• **jsonrpcVersion**: *string*

*Defined in [contractkit/src/utils/rpc-caller.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L68)*

___

###  provider

• **provider**: *Provider*

*Defined in [contractkit/src/utils/rpc-caller.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L68)*

## Methods

###  call

▸ **call**(`method`: string, `params`: any[]): *Promise‹JsonRPCResponse›*

*Defined in [contractkit/src/utils/rpc-caller.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`method` | string |
`params` | any[] |

**Returns:** *Promise‹JsonRPCResponse›*

___

###  send

▸ **send**(`payload`: JsonRPCRequest, `callback`: Callback‹JsonRPCResponse›): *void*

*Defined in [contractkit/src/utils/rpc-caller.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`payload` | JsonRPCRequest |
`callback` | Callback‹JsonRPCResponse› |

**Returns:** *void*
