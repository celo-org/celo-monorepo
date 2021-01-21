# DefaultRpcCaller

## Hierarchy

* **DefaultRpcCaller**

## Implements

* [RpcCaller]()

## Index

### Constructors

* [constructor]()

### Properties

* [defaultProvider]()
* [jsonrpcVersion]()

### Methods

* [call]()
* [send]()

## Constructors

### constructor

+ **new DefaultRpcCaller**\(`defaultProvider`: [Provider](), `jsonrpcVersion`: string\): [_DefaultRpcCaller_]()

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:67_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L67)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `defaultProvider` | [Provider]() | - |
| `jsonrpcVersion` | string | "2.0" |

**Returns:** [_DefaultRpcCaller_]()

## Properties

### `Readonly` defaultProvider

• **defaultProvider**: [_Provider_]()

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L68)

### `Readonly` jsonrpcVersion

• **jsonrpcVersion**: _string_

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L68)

## Methods

### call

▸ **call**\(`method`: string, `params`: any\[\]\): _Promise‹_[_JsonRpcResponse_]()_›_

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L70)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `method` | string |
| `params` | any\[\] |

**Returns:** _Promise‹_[_JsonRpcResponse_]()_›_

### send

▸ **send**\(`payload`: [JsonRpcPayload](), `callback`: [Callback](_types_.md#callback)‹[JsonRpcResponse]()›\): _void_

_Defined in_ [_packages/sdk/connect/src/utils/rpc-caller.ts:88_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/rpc-caller.ts#L88)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `payload` | [JsonRpcPayload]() |
| `callback` | [Callback](_types_.md#callback)‹[JsonRpcResponse]()› |

**Returns:** _void_

