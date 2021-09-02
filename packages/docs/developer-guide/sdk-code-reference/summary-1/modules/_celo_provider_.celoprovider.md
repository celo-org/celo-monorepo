# CeloProvider

## Hierarchy

* **CeloProvider**

## Implements

* [Provider]()

## Index

### Constructors

* [constructor]()

### Properties

* [connection]()
* [existingProvider]()

### Accessors

* [connected]()

### Methods

* [addAccount]()
* [getAccounts]()
* [isLocalAccount]()
* [removeAccount]()
* [send]()
* [stop]()
* [supportsSubscriptions]()

## Constructors

### constructor

+ **new CeloProvider**\(`existingProvider`: [Provider](), `connection`: [Connection]()\): [_CeloProvider_]()

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L37)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `existingProvider` | [Provider]() |
| `connection` | [Connection]() |

**Returns:** [_CeloProvider_]()

## Properties

### `Readonly` connection

• **connection**: [_Connection_]()

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L39)

### `Readonly` existingProvider

• **existingProvider**: [_Provider_]()

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L39)

## Accessors

### connected

• **get connected**\(\): _any_

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:242_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L242)

**Returns:** _any_

## Methods

### addAccount

▸ **addAccount**\(`privateKey`: string\): _void_

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L44)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |

**Returns:** _void_

### getAccounts

▸ **getAccounts**\(\): _Promise‹string\[\]›_

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:54_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L54)

**Returns:** _Promise‹string\[\]›_

### isLocalAccount

▸ **isLocalAccount**\(`address?`: undefined \| string\): _boolean_

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L58)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | undefined \| string |

**Returns:** _boolean_

### removeAccount

▸ **removeAccount**\(`address`: string\): _void_

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:49_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L49)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _void_

### send

▸ **send**\(`payload`: [JsonRpcPayload](), `callback`: [Callback](_types_.md#callback)‹[JsonRpcResponse]()›\): _void_

_Implementation of_ [_Provider_]()

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L65)

Send method as expected by web3.js

**Parameters:**

| Name | Type |
| :--- | :--- |
| `payload` | [JsonRpcPayload]() |
| `callback` | [Callback](_types_.md#callback)‹[JsonRpcResponse]()› |

**Returns:** _void_

### stop

▸ **stop**\(\): _void_

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:140_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L140)

**Returns:** _void_

### supportsSubscriptions

▸ **supportsSubscriptions**\(\): _any_

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:246_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L246)

**Returns:** _any_

