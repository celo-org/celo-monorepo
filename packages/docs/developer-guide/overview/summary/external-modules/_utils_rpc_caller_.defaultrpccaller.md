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

+ **new DefaultRpcCaller**\(`defaultProvider`: provider, `jsonrpcVersion`: string\): [_DefaultRpcCaller_]()

_Defined in_ [_contractkit/src/utils/rpc-caller.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L68)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `defaultProvider` | provider | - |
| `jsonrpcVersion` | string | "2.0" |

**Returns:** [_DefaultRpcCaller_]()

## Properties

### defaultProvider

• **defaultProvider**: _provider_

_Defined in_ [_contractkit/src/utils/rpc-caller.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L69)

### jsonrpcVersion

• **jsonrpcVersion**: _string_

_Defined in_ [_contractkit/src/utils/rpc-caller.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L69)

## Methods

### call

▸ **call**\(`method`: string, `params`: any\[\]\): _Promise‹JsonRpcResponse›_

_Defined in_ [_contractkit/src/utils/rpc-caller.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L71)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `method` | string |
| `params` | any\[\] |

**Returns:** _Promise‹JsonRpcResponse›_

### send

▸ **send**\(`payload`: JsonRpcPayload, `callback`: Callback‹JsonRpcResponse›\): _void_

_Defined in_ [_contractkit/src/utils/rpc-caller.ts:89_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/rpc-caller.ts#L89)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `payload` | JsonRpcPayload |
| `callback` | Callback‹JsonRpcResponse› |

**Returns:** _void_

