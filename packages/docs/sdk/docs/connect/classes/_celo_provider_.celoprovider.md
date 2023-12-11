[@celo/connect](../README.md) › [Globals](../globals.md) › ["celo-provider"](../modules/_celo_provider_.md) › [CeloProvider](_celo_provider_.celoprovider.md)

# Class: CeloProvider

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

###  constructor

\+ **new CeloProvider**(`existingProvider`: [Provider](../interfaces/_types_.provider.md), `connection`: [Connection](_connection_.connection.md)): *[CeloProvider](_celo_provider_.celoprovider.md)*

*Defined in [celo-provider.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`existingProvider` | [Provider](../interfaces/_types_.provider.md) |
`connection` | [Connection](_connection_.connection.md) |

**Returns:** *[CeloProvider](_celo_provider_.celoprovider.md)*

## Properties

### `Readonly` connection

• **connection**: *[Connection](_connection_.connection.md)*

*Defined in [celo-provider.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L53)*

___

### `Readonly` existingProvider

• **existingProvider**: *[Provider](../interfaces/_types_.provider.md)*

*Defined in [celo-provider.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L53)*

## Accessors

###  connected

• **get connected**(): *any*

*Defined in [celo-provider.ts:260](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L260)*

**Returns:** *any*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [celo-provider.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  getAccounts

▸ **getAccounts**(): *Promise‹string[]›*

*Defined in [celo-provider.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L68)*

**Returns:** *Promise‹string[]›*

___

###  isLocalAccount

▸ **isLocalAccount**(`address?`: undefined | string): *boolean*

*Defined in [celo-provider.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | undefined &#124; string |

**Returns:** *boolean*

___

###  removeAccount

▸ **removeAccount**(`address`: string): *void*

*Defined in [celo-provider.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *void*

___

###  send

▸ **send**(`payload`: [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md), `callback`: [Callback](../modules/_types_.md#callback)‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)›): *void*

*Defined in [celo-provider.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L79)*

Send method as expected by web3.js

**Parameters:**

Name | Type |
------ | ------ |
`payload` | [JsonRpcPayload](../interfaces/_types_.jsonrpcpayload.md) |
`callback` | [Callback](../modules/_types_.md#callback)‹[JsonRpcResponse](../interfaces/_types_.jsonrpcresponse.md)› |

**Returns:** *void*

___

###  stop

▸ **stop**(): *void*

*Defined in [celo-provider.ts:158](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L158)*

**Returns:** *void*

___

###  supportsSubscriptions

▸ **supportsSubscriptions**(): *any*

*Defined in [celo-provider.ts:264](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/celo-provider.ts#L264)*

**Returns:** *any*
