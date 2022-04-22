[@celo/base](../README.md) › ["future"](../modules/_future_.md) › [Future](_future_.future.md)

# Class: Future <**T**>

**`internal`** 

## Type parameters

▪ **T**

## Hierarchy

* **Future**

## Index

### Constructors

* [constructor](_future_.future.md#constructor)

### Accessors

* [error](_future_.future.md#error)
* [finished](_future_.future.md#finished)

### Methods

* [asPromise](_future_.future.md#aspromise)
* [reject](_future_.future.md#reject)
* [resolve](_future_.future.md#resolve)
* [wait](_future_.future.md#wait)

## Constructors

###  constructor

\+ **new Future**(): *[Future](_future_.future.md)*

*Defined in [packages/sdk/base/src/future.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L8)*

**Returns:** *[Future](_future_.future.md)*

## Accessors

###  error

• **get error**(): *any*

*Defined in [packages/sdk/base/src/future.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L21)*

**Returns:** *any*

___

###  finished

• **get finished**(): *boolean*

*Defined in [packages/sdk/base/src/future.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L17)*

**Returns:** *boolean*

## Methods

###  asPromise

▸ **asPromise**(): *Promise‹T›*

*Defined in [packages/sdk/base/src/future.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L41)*

**Returns:** *Promise‹T›*

___

###  reject

▸ **reject**(`error`: any): *void*

*Defined in [packages/sdk/base/src/future.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`error` | any |

**Returns:** *void*

___

###  resolve

▸ **resolve**(`value`: T): *void*

*Defined in [packages/sdk/base/src/future.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | T |

**Returns:** *void*

___

###  wait

▸ **wait**(): *Promise‹T›*

*Defined in [packages/sdk/base/src/future.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L37)*

**Returns:** *Promise‹T›*
