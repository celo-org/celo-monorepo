# External module: "wrappers/BaseWrapper"

## Index

### Classes

* [BaseWrapper](../classes/_wrappers_basewrapper_.basewrapper.md)
* [CeloTransactionObject](../classes/_wrappers_basewrapper_.celotransactionobject.md)

### Type aliases

* [CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams)

### Variables

* [stringToBuffer](_wrappers_basewrapper_.md#const-stringtobuffer)

### Functions

* [bufferToBytes](_wrappers_basewrapper_.md#const-buffertobytes)
* [bufferToString](_wrappers_basewrapper_.md#const-buffertostring)
* [bytesToString](_wrappers_basewrapper_.md#const-bytestostring)
* [identity](_wrappers_basewrapper_.md#const-identity)
* [proxyCall](_wrappers_basewrapper_.md#proxycall)
* [proxySend](_wrappers_basewrapper_.md#proxysend)
* [stringToBytes](_wrappers_basewrapper_.md#const-stringtobytes)
* [toTransactionObject](_wrappers_basewrapper_.md#totransactionobject)
* [tupleParser](_wrappers_basewrapper_.md#tupleparser)
* [valueToBigNumber](_wrappers_basewrapper_.md#const-valuetobignumber)
* [valueToFrac](_wrappers_basewrapper_.md#const-valuetofrac)
* [valueToInt](_wrappers_basewrapper_.md#const-valuetoint)
* [valueToString](_wrappers_basewrapper_.md#const-valuetostring)

## Type aliases

###  CeloTransactionParams

Ƭ **CeloTransactionParams**: *Omit‹Tx, "data"›*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:236](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L236)*

## Variables

### `Const` stringToBuffer

• **stringToBuffer**: *function* = hexToBuffer

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L49)*

#### Type declaration:

▸ (`input`: string): *Buffer*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

## Functions

### `Const` bufferToBytes

▸ **bufferToBytes**(`input`: Buffer): *string | number[][]*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | Buffer |

**Returns:** *string | number[][]*

___

### `Const` bufferToString

▸ **bufferToString**(`buf`: Buffer): *string*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`buf` | Buffer |

**Returns:** *string*

___

### `Const` bytesToString

▸ **bytesToString**(`input`: SolBytes): *string*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | SolBytes |

**Returns:** *string*

___

### `Const` identity

▸ **identity**<**A**>(`a`: A): *A*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L66)*

Identity Parser

**Type parameters:**

▪ **A**

**Parameters:**

Name | Type |
------ | ------ |
`a` | A |

**Returns:** *A*

___

###  proxyCall

▸ **proxyCall**<**InputArgs**, **ParsedInputArgs**, **PreParsedOutput**, **Output**>(`methodFn`: Method‹ParsedInputArgs, PreParsedOutput›, `parseInputArgs`: function, `parseOutput`: function): *function*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L134)*

Creates a proxy to call a web3 native contract method.

There are 4 cases:
 - methodFn
 - parseInputArgs => methodFn
 - parseInputArgs => methodFn => parseOutput
 - methodFn => parseOutput

**Type parameters:**

▪ **InputArgs**: *any[]*

▪ **ParsedInputArgs**: *any[]*

▪ **PreParsedOutput**

▪ **Output**

**Parameters:**

▪ **methodFn**: *Method‹ParsedInputArgs, PreParsedOutput›*

Web3 methods function

▪ **parseInputArgs**: *function*

parseInputArgs function, tranforms arguments into `methodFn` expected inputs

▸ (...`args`: InputArgs): *ParsedInputArgs*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

▪ **parseOutput**: *function*

parseOutput function, transforms `methodFn` output into proxy return

▸ (`o`: PreParsedOutput): *Output*

**Parameters:**

Name | Type |
------ | ------ |
`o` | PreParsedOutput |

**Returns:** *function*

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

▸ **proxyCall**<**InputArgs**, **PreParsedOutput**, **Output**>(`methodFn`: Method‹InputArgs, PreParsedOutput›, `x`: undefined, `parseOutput`: function): *function*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:144](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L144)*

**Type parameters:**

▪ **InputArgs**: *any[]*

▪ **PreParsedOutput**

▪ **Output**

**Parameters:**

▪ **methodFn**: *Method‹InputArgs, PreParsedOutput›*

▪ **x**: *undefined*

▪ **parseOutput**: *function*

▸ (`o`: PreParsedOutput): *Output*

**Parameters:**

Name | Type |
------ | ------ |
`o` | PreParsedOutput |

**Returns:** *function*

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

▸ **proxyCall**<**InputArgs**, **ParsedInputArgs**, **Output**>(`methodFn`: Method‹ParsedInputArgs, Output›, `parseInputArgs`: function): *function*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:149](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L149)*

**Type parameters:**

▪ **InputArgs**: *any[]*

▪ **ParsedInputArgs**: *any[]*

▪ **Output**

**Parameters:**

▪ **methodFn**: *Method‹ParsedInputArgs, Output›*

▪ **parseInputArgs**: *function*

▸ (...`args`: InputArgs): *ParsedInputArgs*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

**Returns:** *function*

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

▸ **proxyCall**<**InputArgs**, **Output**>(`methodFn`: Method‹InputArgs, Output›): *function*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:153](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L153)*

**Type parameters:**

▪ **InputArgs**: *any[]*

▪ **Output**

**Parameters:**

Name | Type |
------ | ------ |
`methodFn` | Method‹InputArgs, Output› |

**Returns:** *function*

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  proxySend

▸ **proxySend**<**InputArgs**, **ParsedInputArgs**, **Output**>(`kit`: [ContractKit](../classes/_kit_.contractkit.md), ...`sendArgs`: ProxySendArgs‹InputArgs, ParsedInputArgs, Output›): *function*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:214](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L214)*

Creates a proxy to send a tx on a web3 native contract method.

There are 2 cases:
 - call methodFn (no pre or post parsing)
 - preParse arguments & call methodFn

**Type parameters:**

▪ **InputArgs**: *any[]*

▪ **ParsedInputArgs**: *any[]*

▪ **Output**

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](../classes/_kit_.contractkit.md) |
`...sendArgs` | ProxySendArgs‹InputArgs, ParsedInputArgs, Output› |

**Returns:** *function*

▸ (...`args`: InputArgs): *[CeloTransactionObject](../classes/_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

### `Const` stringToBytes

▸ **stringToBytes**(`input`: string): *string | number[][]*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string | number[][]*

___

###  toTransactionObject

▸ **toTransactionObject**<**O**>(`kit`: [ContractKit](../classes/_kit_.contractkit.md), `txo`: TransactionObject‹O›, `defaultParams?`: Omit‹Tx, "data"›): *[CeloTransactionObject](../classes/_wrappers_basewrapper_.celotransactionobject.md)‹O›*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:228](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L228)*

**Type parameters:**

▪ **O**

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](../classes/_kit_.contractkit.md) |
`txo` | TransactionObject‹O› |
`defaultParams?` | Omit‹Tx, "data"› |

**Returns:** *[CeloTransactionObject](../classes/_wrappers_basewrapper_.celotransactionobject.md)‹O›*

___

###  tupleParser

▸ **tupleParser**<**A0**, **B0**>(`parser0`: Parser‹A0, B0›): *function*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L72)*

Tuple parser
Useful to map different input arguments

**Type parameters:**

▪ **A0**

▪ **B0**

**Parameters:**

Name | Type |
------ | ------ |
`parser0` | Parser‹A0, B0› |

**Returns:** *function*

▸ (...`args`: [A0]): *[B0]*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | [A0] |

▸ **tupleParser**<**A0**, **B0**, **A1**, **B1**>(`parser0`: Parser‹A0, B0›, `parser1`: Parser‹A1, B1›): *function*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L73)*

**Type parameters:**

▪ **A0**

▪ **B0**

▪ **A1**

▪ **B1**

**Parameters:**

Name | Type |
------ | ------ |
`parser0` | Parser‹A0, B0› |
`parser1` | Parser‹A1, B1› |

**Returns:** *function*

▸ (...`args`: [A0, A1]): *[B0, B1]*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | [A0, A1] |

▸ **tupleParser**<**A0**, **B0**, **A1**, **B1**, **A2**, **B2**>(`parser0`: Parser‹A0, B0›, `parser1`: Parser‹A1, B1›, `parser2`: Parser‹A2, B2›): *function*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L77)*

**Type parameters:**

▪ **A0**

▪ **B0**

▪ **A1**

▪ **B1**

▪ **A2**

▪ **B2**

**Parameters:**

Name | Type |
------ | ------ |
`parser0` | Parser‹A0, B0› |
`parser1` | Parser‹A1, B1› |
`parser2` | Parser‹A2, B2› |

**Returns:** *function*

▸ (...`args`: [A0, A1, A2]): *[B0, B1, B2]*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | [A0, A1, A2] |

▸ **tupleParser**<**A0**, **B0**, **A1**, **B1**, **A2**, **B2**, **A3**, **B3**>(`parser0`: Parser‹A0, B0›, `parser1`: Parser‹A1, B1›, `parser2`: Parser‹A2, B2›, `parser3`: Parser‹A3, B3›): *function*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L82)*

**Type parameters:**

▪ **A0**

▪ **B0**

▪ **A1**

▪ **B1**

▪ **A2**

▪ **B2**

▪ **A3**

▪ **B3**

**Parameters:**

Name | Type |
------ | ------ |
`parser0` | Parser‹A0, B0› |
`parser1` | Parser‹A1, B1› |
`parser2` | Parser‹A2, B2› |
`parser3` | Parser‹A3, B3› |

**Returns:** *function*

▸ (...`args`: [A0, A1, A2, A3]): *[B0, B1, B2, B3]*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | [A0, A1, A2, A3] |

___

### `Const` valueToBigNumber

▸ **valueToBigNumber**(`input`: BigNumber.Value): *BigNumber‹›*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *BigNumber‹›*

___

### `Const` valueToFrac

▸ **valueToFrac**(`numerator`: BigNumber.Value, `denominator`: BigNumber.Value): *BigNumber‹›*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`numerator` | BigNumber.Value |
`denominator` | BigNumber.Value |

**Returns:** *BigNumber‹›*

___

### `Const` valueToInt

▸ **valueToInt**(`input`: BigNumber.Value): *number*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *number*

___

### `Const` valueToString

▸ **valueToString**(`input`: BigNumber.Value): *string*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *string*
