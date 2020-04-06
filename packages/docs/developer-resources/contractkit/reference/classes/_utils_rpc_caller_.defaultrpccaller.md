# Class: DefaultRpcCaller

## Hierarchy

* **DefaultRpcCaller**

## Implements

* [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md)

## Index

### Constructors

* [constructor](_utils_rpc_caller_.defaultrpccaller.md#constructor)

### Properties

* [defaultProvider](_utils_rpc_caller_.defaultrpccaller.md#defaultprovider)
* [jsonrpcVersion](_utils_rpc_caller_.defaultrpccaller.md#jsonrpcversion)

### Methods

* [call](_utils_rpc_caller_.defaultrpccaller.md#call)
* [send](_utils_rpc_caller_.defaultrpccaller.md#send)

## Constructors

###  constructor

\+ **new DefaultRpcCaller**(`defaultProvider`: provider, `jsonrpcVersion`: string): *[DefaultRpcCaller](_utils_rpc_caller_.defaultrpccaller.md)*

*Defined in [contractkit/src/utils/rpc-caller.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L68)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`defaultProvider` | provider | - |
`jsonrpcVersion` | string | "2.0" |

**Returns:** *[DefaultRpcCaller](_utils_rpc_caller_.defaultrpccaller.md)*

## Properties

###  defaultProvider

• **defaultProvider**: *provider*

*Defined in [contractkit/src/utils/rpc-caller.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L69)*

___

###  jsonrpcVersion

• **jsonrpcVersion**: *string*

*Defined in [contractkit/src/utils/rpc-caller.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L69)*

## Methods

###  call

▸ **call**(`method`: string, `params`: any[]): *Promise‹JsonRpcResponse›*

*Defined in [contractkit/src/utils/rpc-caller.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L71)*

**Parameters:**

Name | Type |
------ | ------ |
`method` | string |
`params` | any[] |

**Returns:** *Promise‹JsonRpcResponse›*

___

###  send

▸ **send**(`payload`: JsonRpcPayload, `callback`: Callback‹JsonRpcResponse›): *void*

*Defined in [contractkit/src/utils/rpc-caller.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L89)*

**Parameters:**

Name | Type |
------ | ------ |
`payload` | JsonRpcPayload |
`callback` | Callback‹JsonRpcResponse› |

**Returns:** *void*
