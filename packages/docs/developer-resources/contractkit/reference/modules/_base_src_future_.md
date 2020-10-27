# External module: "base/src/future"

## Index

### Classes

* [Future](../classes/_base_src_future_.future.md)

### Functions

* [pipeToFuture](_base_src_future_.md#pipetofuture)
* [toFuture](_base_src_future_.md#tofuture)

## Functions

###  pipeToFuture

▸ **pipeToFuture**<**A**>(`p`: Promise‹A›, `future`: [Future](../classes/_base_src_future_.future.md)‹A›): *[Future](../classes/_base_src_future_.future.md)‹A›*

*Defined in [packages/base/src/future.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/future.ts#L50)*

**Type parameters:**

▪ **A**

**Parameters:**

Name | Type |
------ | ------ |
`p` | Promise‹A› |
`future` | [Future](../classes/_base_src_future_.future.md)‹A› |

**Returns:** *[Future](../classes/_base_src_future_.future.md)‹A›*

___

###  toFuture

▸ **toFuture**<**A**>(`p`: Promise‹A›): *[Future](../classes/_base_src_future_.future.md)‹A›*

*Defined in [packages/base/src/future.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/future.ts#L45)*

**Type parameters:**

▪ **A**

**Parameters:**

Name | Type |
------ | ------ |
`p` | Promise‹A› |

**Returns:** *[Future](../classes/_base_src_future_.future.md)‹A›*
