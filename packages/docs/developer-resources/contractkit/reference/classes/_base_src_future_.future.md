# Class: Future <**T**>

## Type parameters

▪ **T**

## Hierarchy

* **Future**

## Index

### Constructors

* [constructor](_base_src_future_.future.md#constructor)

### Accessors

* [error](_base_src_future_.future.md#error)
* [finished](_base_src_future_.future.md#finished)

### Methods

* [asPromise](_base_src_future_.future.md#aspromise)
* [reject](_base_src_future_.future.md#reject)
* [resolve](_base_src_future_.future.md#resolve)
* [wait](_base_src_future_.future.md#wait)

## Constructors

###  constructor

\+ **new Future**(): *[Future](_base_src_future_.future.md)*

*Defined in [packages/base/src/future.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/future.ts#L7)*

**Returns:** *[Future](_base_src_future_.future.md)*

## Accessors

###  error

• **get error**(): *any*

*Defined in [packages/base/src/future.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/future.ts#L20)*

**Returns:** *any*

___

###  finished

• **get finished**(): *boolean*

*Defined in [packages/base/src/future.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/future.ts#L16)*

**Returns:** *boolean*

## Methods

###  asPromise

▸ **asPromise**(): *Promise‹T›*

*Defined in [packages/base/src/future.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/future.ts#L40)*

**Returns:** *Promise‹T›*

___

###  reject

▸ **reject**(`error`: any): *void*

*Defined in [packages/base/src/future.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/future.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`error` | any |

**Returns:** *void*

___

###  resolve

▸ **resolve**(`value`: T): *void*

*Defined in [packages/base/src/future.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/future.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | T |

**Returns:** *void*

___

###  wait

▸ **wait**(): *Promise‹T›*

*Defined in [packages/base/src/future.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/future.ts#L36)*

**Returns:** *Promise‹T›*
