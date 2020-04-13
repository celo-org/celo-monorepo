# External module: "wrappers/BaseWrapper"

## Index

### Classes

* [BaseWrapper](../classes/_wrappers_basewrapper_.basewrapper.md)
* [CeloTransactionObject](../classes/_wrappers_basewrapper_.celotransactionobject.md)

### Interfaces

* [Filter](../interfaces/_wrappers_basewrapper_.filter.md)

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
* [stringIdentity](_wrappers_basewrapper_.md#const-stringidentity)
* [stringToBytes](_wrappers_basewrapper_.md#const-stringtobytes)
* [toTransactionObject](_wrappers_basewrapper_.md#totransactionobject)
* [tupleParser](_wrappers_basewrapper_.md#tupleparser)
* [valueToBigNumber](_wrappers_basewrapper_.md#const-valuetobignumber)
* [valueToFixidityString](_wrappers_basewrapper_.md#const-valuetofixiditystring)
* [valueToFrac](_wrappers_basewrapper_.md#const-valuetofrac)
* [valueToInt](_wrappers_basewrapper_.md#const-valuetoint)
* [valueToString](_wrappers_basewrapper_.md#const-valuetostring)

## Type aliases

###  CeloTransactionParams

Ƭ **CeloTransactionParams**: *Omit‹Tx, "data"›*

*Defined in [src/wrappers/BaseWrapper.ts:239](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L239)*

## Variables

### `Const` stringToBuffer

• **stringToBuffer**: *function* = hexToBuffer

*Defined in [src/wrappers/BaseWrapper.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L51)*

#### Type declaration:

▸ (`input`: string): *Buffer*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

## Functions

### `Const` bufferToBytes

▸ **bufferToBytes**(`input`: Buffer): *string | number[]*

*Defined in [src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | Buffer |

**Returns:** *string | number[]*

___

### `Const` bufferToString

▸ **bufferToString**(`buf`: Buffer): *string*

*Defined in [src/wrappers/BaseWrapper.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`buf` | Buffer |

**Returns:** *string*

___

### `Const` bytesToString

▸ **bytesToString**(`input`: SolBytes): *string*

*Defined in [src/wrappers/BaseWrapper.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | SolBytes |

**Returns:** *string*

___

### `Const` identity

▸ **identity**<**A**>(`a`: A): *A*

*Defined in [src/wrappers/BaseWrapper.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L68)*

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

*Defined in [src/wrappers/BaseWrapper.ts:137](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L137)*

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

*Defined in [src/wrappers/BaseWrapper.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L147)*

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

*Defined in [src/wrappers/BaseWrapper.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L152)*

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

*Defined in [src/wrappers/BaseWrapper.ts:156](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L156)*

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

*Defined in [src/wrappers/BaseWrapper.ts:217](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L217)*

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

### `Const` stringIdentity

▸ **stringIdentity**(`x`: string): *string*

*Defined in [src/wrappers/BaseWrapper.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`x` | string |

**Returns:** *string*

___

### `Const` stringToBytes

▸ **stringToBytes**(`input`: string): *string | number[]*

*Defined in [src/wrappers/BaseWrapper.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string | number[]*

___

###  toTransactionObject

▸ **toTransactionObject**<**O**>(`kit`: [ContractKit](../classes/_kit_.contractkit.md), `txo`: TransactionObject‹O›, `defaultParams?`: Omit‹Tx, "data"›): *[CeloTransactionObject](../classes/_wrappers_basewrapper_.celotransactionobject.md)‹O›*

*Defined in [src/wrappers/BaseWrapper.ts:231](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L231)*

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

*Defined in [src/wrappers/BaseWrapper.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L75)*

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

*Defined in [src/wrappers/BaseWrapper.ts:76](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L76)*

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

*Defined in [src/wrappers/BaseWrapper.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L80)*

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

*Defined in [src/wrappers/BaseWrapper.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L85)*

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

*Defined in [src/wrappers/BaseWrapper.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *BigNumber‹›*

___

### `Const` valueToFixidityString

▸ **valueToFixidityString**(`input`: BigNumber.Value): *string*

*Defined in [src/wrappers/BaseWrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *string*

___

### `Const` valueToFrac

▸ **valueToFrac**(`numerator`: BigNumber.Value, `denominator`: BigNumber.Value): *BigNumber‹›*

*Defined in [src/wrappers/BaseWrapper.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`numerator` | BigNumber.Value |
`denominator` | BigNumber.Value |

**Returns:** *BigNumber‹›*

___

### `Const` valueToInt

▸ **valueToInt**(`input`: BigNumber.Value): *number*

*Defined in [src/wrappers/BaseWrapper.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *number*

___

### `Const` valueToString

▸ **valueToString**(`input`: BigNumber.Value): *string*

*Defined in [src/wrappers/BaseWrapper.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *string*
