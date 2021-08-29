# CeloProvider

## Hierarchy

* **CeloProvider**

## Implements

* [Provider](../interfaces/_types_.provider.md)

## Index

### Constructors

* [constructor](_celo_provider_.celoprovider.md#constructor)

### Properties

* [connection](_celo_provider_.celoprovider.md#readonly-connection)
* [existingProvider](_celo_provider_.celoprovider.md#readonly-existingprovider)

### Accessors

* [connected](_celo_provider_.celoprovider.md#connected)

### Methods

* [addAccount](_celo_provider_.celoprovider.md#addaccount)
* [getAccounts](_celo_provider_.celoprovider.md#getaccounts)
* [isLocalAccount](_celo_provider_.celoprovider.md#islocalaccount)
* [removeAccount](_celo_provider_.celoprovider.md#removeaccount)
* [send](_celo_provider_.celoprovider.md#send)
* [stop](_celo_provider_.celoprovider.md#stop)
* [supportsSubscriptions](_celo_provider_.celoprovider.md#supportssubscriptions)

## Constructors

### constructor

+ **new CeloProvider**\(`existingProvider`: [Provider](../interfaces/_types_.provider.md), `connection`: [Connection](_connection_.connection.md)\): [_CeloProvider_](_celo_provider_.celoprovider.md)

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L37)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `existingProvider` | [Provider](../interfaces/_types_.provider.md) |
| `connection` | [Connection](_connection_.connection.md) |

**Returns:** [_CeloProvider_](_celo_provider_.celoprovider.md)

## Properties

### `Readonly` connection

• **connection**: [_Connection_](_connection_.connection.md)

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L39)

### `Readonly` existingProvider

• **existingProvider**: [_Provider_](../interfaces/_types_.provider.md)

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

▸ **send**\(`payload`: [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md), `callback`: [Callback](../modules/_types_.md#callback)‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)›\): _void_

_Implementation of_ [_Provider_](../interfaces/_types_.provider.md)

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L65)

Send method as expected by web3.js

**Parameters:**

| Name | Type |
| :--- | :--- |
| `payload` | [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md) |
| `callback` | [Callback](../modules/_types_.md#callback)‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)› |

**Returns:** _void_

### stop

▸ **stop**\(\): _void_

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:140_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L140)

**Returns:** _void_

### supportsSubscriptions

▸ **supportsSubscriptions**\(\): _any_

_Defined in_ [_packages/sdk/connect/src/celo-provider.ts:246_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L246)

**Returns:** _any_

