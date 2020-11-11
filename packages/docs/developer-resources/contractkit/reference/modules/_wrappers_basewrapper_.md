# External module: "wrappers/BaseWrapper"

## Index

### Classes

* [BaseWrapper](../classes/_wrappers_basewrapper_.basewrapper.md)
* [CeloTransactionObject](../classes/_wrappers_basewrapper_.celotransactionobject.md)

### Interfaces

* [Filter](../interfaces/_wrappers_basewrapper_.filter.md)

### Type aliases

* [CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams)

### Functions

* [blocksToDurationString](_wrappers_basewrapper_.md#const-blockstodurationstring)
* [bufferToSolidityBytes](_wrappers_basewrapper_.md#const-buffertosoliditybytes)
* [fixidityValueToBigNumber](_wrappers_basewrapper_.md#const-fixidityvaluetobignumber)
* [identity](_wrappers_basewrapper_.md#const-identity)
* [proxyCall](_wrappers_basewrapper_.md#proxycall)
* [proxySend](_wrappers_basewrapper_.md#proxysend)
* [secondsToDurationString](_wrappers_basewrapper_.md#secondstodurationstring)
* [solidityBytesToString](_wrappers_basewrapper_.md#const-soliditybytestostring)
* [stringIdentity](_wrappers_basewrapper_.md#const-stringidentity)
* [stringToSolidityBytes](_wrappers_basewrapper_.md#const-stringtosoliditybytes)
* [toTransactionObject](_wrappers_basewrapper_.md#totransactionobject)
* [tupleParser](_wrappers_basewrapper_.md#tupleparser)
* [unixSecondsTimestampToDateString](_wrappers_basewrapper_.md#const-unixsecondstimestamptodatestring)
* [valueToBigNumber](_wrappers_basewrapper_.md#const-valuetobignumber)
* [valueToFixidityString](_wrappers_basewrapper_.md#const-valuetofixiditystring)
* [valueToFrac](_wrappers_basewrapper_.md#const-valuetofrac)
* [valueToInt](_wrappers_basewrapper_.md#const-valuetoint)
* [valueToString](_wrappers_basewrapper_.md#const-valuetostring)

## Type aliases

###  CeloTransactionParams

Ƭ **CeloTransactionParams**: *Omit‹Tx, "data"›*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:320](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L320)*

## Functions

### `Const` blocksToDurationString

▸ **blocksToDurationString**(`input`: BigNumber.Value): *string*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:124](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L124)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *string*

___

### `Const` bufferToSolidityBytes

▸ **bufferToSolidityBytes**(`input`: Buffer): *string | number[]*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L134)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | Buffer |

**Returns:** *string | number[]*

___

### `Const` fixidityValueToBigNumber

▸ **fixidityValueToBigNumber**(`input`: BigNumber.Value): *BigNumber‹›*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *BigNumber‹›*

___

### `Const` identity

▸ **identity**<**A**>(`a`: A): *A*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:149](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L149)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:218](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L218)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:228](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L228)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:233](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L233)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:237](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L237)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:298](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L298)*

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

###  secondsToDurationString

▸ **secondsToDurationString**(`durationSeconds`: BigNumber.Value, `outputUnits`: TimeUnit[]): *string*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:95](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L95)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`durationSeconds` | BigNumber.Value | - |
`outputUnits` | TimeUnit[] | ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'] |

**Returns:** *string*

___

### `Const` solidityBytesToString

▸ **solidityBytesToString**(`input`: SolidityBytes): *string*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:135](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L135)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | SolidityBytes |

**Returns:** *string*

___

### `Const` stringIdentity

▸ **stringIdentity**(`x`: string): *string*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:150](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L150)*

**Parameters:**

Name | Type |
------ | ------ |
`x` | string |

**Returns:** *string*

___

### `Const` stringToSolidityBytes

▸ **stringToSolidityBytes**(`input`: string): *string | number[]*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:133](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string | number[]*

___

###  toTransactionObject

▸ **toTransactionObject**<**O**>(`kit`: [ContractKit](../classes/_kit_.contractkit.md), `txo`: TransactionObject‹O›, `defaultParams?`: Omit‹Tx, "data"›): *[CeloTransactionObject](../classes/_wrappers_basewrapper_.celotransactionobject.md)‹O›*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:312](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L312)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:156](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L156)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:157](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L157)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:161](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L161)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:166](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L166)*

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

### `Const` unixSecondsTimestampToDateString

▸ **unixSecondsTimestampToDateString**(`input`: BigNumber.Value): *string*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:127](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L127)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *string*

___

### `Const` valueToBigNumber

▸ **valueToBigNumber**(`input`: BigNumber.Value): *BigNumber‹›*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L60)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *BigNumber‹›*

___

### `Const` valueToFixidityString

▸ **valueToFixidityString**(`input`: BigNumber.Value): *string*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *string*

___

### `Const` valueToFrac

▸ **valueToFrac**(`numerator`: BigNumber.Value, `denominator`: BigNumber.Value): *BigNumber‹›*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`numerator` | BigNumber.Value |
`denominator` | BigNumber.Value |

**Returns:** *BigNumber‹›*

___

### `Const` valueToInt

▸ **valueToInt**(`input`: BigNumber.Value): *number*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *number*

___

### `Const` valueToString

▸ **valueToString**(`input`: BigNumber.Value): *string*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *string*
