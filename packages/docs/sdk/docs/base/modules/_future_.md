[@celo/base](../README.md) › ["future"](_future_.md)

# Module: "future"

## Index

### Classes

* [Future](../classes/_future_.future.md)

### Functions

* [pipeToFuture](_future_.md#pipetofuture)
* [toFuture](_future_.md#tofuture)

## Functions

###  pipeToFuture

▸ **pipeToFuture**<**A**>(`p`: Promise‹A›, `future`: [Future](../classes/_future_.future.md)‹A›): *[Future](../classes/_future_.future.md)‹A›*

*Defined in [packages/sdk/base/src/future.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L51)*

**`internal`** 

**Type parameters:**

▪ **A**

**Parameters:**

Name | Type |
------ | ------ |
`p` | Promise‹A› |
`future` | [Future](../classes/_future_.future.md)‹A› |

**Returns:** *[Future](../classes/_future_.future.md)‹A›*

___

###  toFuture

▸ **toFuture**<**A**>(`p`: Promise‹A›): *[Future](../classes/_future_.future.md)‹A›*

*Defined in [packages/sdk/base/src/future.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/future.ts#L46)*

**`internal`** 

**Type parameters:**

▪ **A**

**Parameters:**

Name | Type |
------ | ------ |
`p` | Promise‹A› |

**Returns:** *[Future](../classes/_future_.future.md)‹A›*
