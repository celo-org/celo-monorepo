# Future

## Type parameters

▪ **T**

## Hierarchy

* **Future**

## Index

### Constructors

* [constructor]()

### Accessors

* [error]()
* [finished]()

### Methods

* [asPromise]()
* [reject]()
* [resolve]()
* [wait]()

## Constructors

### constructor

+ **new Future**\(\): [_Future_]()

_Defined in_ [_packages/sdk/base/src/future.ts:7_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L7)

**Returns:** [_Future_]()

## Accessors

### error

• **get error**\(\): _any_

_Defined in_ [_packages/sdk/base/src/future.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L20)

**Returns:** _any_

### finished

• **get finished**\(\): _boolean_

_Defined in_ [_packages/sdk/base/src/future.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L16)

**Returns:** _boolean_

## Methods

### asPromise

▸ **asPromise**\(\): _Promise‹T›_

_Defined in_ [_packages/sdk/base/src/future.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L40)

**Returns:** _Promise‹T›_

### reject

▸ **reject**\(`error`: any\): _void_

_Defined in_ [_packages/sdk/base/src/future.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L30)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `error` | any |

**Returns:** _void_

### resolve

▸ **resolve**\(`value`: T\): _void_

_Defined in_ [_packages/sdk/base/src/future.ts:24_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L24)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `value` | T |

**Returns:** _void_

### wait

▸ **wait**\(\): _Promise‹T›_

_Defined in_ [_packages/sdk/base/src/future.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L36)

**Returns:** _Promise‹T›_

