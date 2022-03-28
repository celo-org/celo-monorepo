[@celo/contractkit](../README.md) › ["wrappers/BaseWrapper"](_wrappers_basewrapper_.md)

# Module: "wrappers/BaseWrapper"

## Index

### Classes

* [BaseWrapper](../classes/_wrappers_basewrapper_.basewrapper.md)

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
* [tupleParser](_wrappers_basewrapper_.md#tupleparser)
* [unixSecondsTimestampToDateString](_wrappers_basewrapper_.md#const-unixsecondstimestamptodatestring)
* [valueToBigNumber](_wrappers_basewrapper_.md#const-valuetobignumber)
* [valueToFixidityString](_wrappers_basewrapper_.md#const-valuetofixiditystring)
* [valueToFrac](_wrappers_basewrapper_.md#const-valuetofrac)
* [valueToInt](_wrappers_basewrapper_.md#const-valuetoint)
* [valueToString](_wrappers_basewrapper_.md#const-valuetostring)

## Functions

### `Const` blocksToDurationString

▸ **blocksToDurationString**(`input`: BigNumber.Value): *string*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:143](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L143)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *string*

___

### `Const` bufferToSolidityBytes

▸ **bufferToSolidityBytes**(`input`: Buffer): *SolidityBytes*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:165](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L165)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | Buffer |

**Returns:** *SolidityBytes*

___

### `Const` fixidityValueToBigNumber

▸ **fixidityValueToBigNumber**(`input`: BigNumber.Value): *BigNumber‹›*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *BigNumber‹›*

___

### `Const` identity

▸ **identity**<**A**>(`a`: A): *A*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:180](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L180)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:249](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L249)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:259](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L259)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:264](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L264)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:268](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L268)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:329](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L329)*

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

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  secondsToDurationString

▸ **secondsToDurationString**(`durationSeconds`: BigNumber.Value, `outputUnits`: TimeUnit[]): *string*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L114)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`durationSeconds` | BigNumber.Value | - |
`outputUnits` | TimeUnit[] | ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'] |

**Returns:** *string*

___

### `Const` solidityBytesToString

▸ **solidityBytesToString**(`input`: SolidityBytes): *string*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:166](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L166)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | SolidityBytes |

**Returns:** *string*

___

### `Const` stringIdentity

▸ **stringIdentity**(`x`: string): *string*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:181](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L181)*

**Parameters:**

Name | Type |
------ | ------ |
`x` | string |

**Returns:** *string*

___

### `Const` stringToSolidityBytes

▸ **stringToSolidityBytes**(`input`: string): *SolidityBytes*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:164](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L164)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *SolidityBytes*

___

###  tupleParser

▸ **tupleParser**<**A0**, **B0**>(`parser0`: Parser‹A0, B0›): *function*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:187](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L187)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:188](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L188)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:192](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L192)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:197](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L197)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:156](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L156)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *string*

___

### `Const` valueToBigNumber

▸ **valueToBigNumber**(`input`: BigNumber.Value): *BigNumber‹›*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *BigNumber‹›*

___

### `Const` valueToFixidityString

▸ **valueToFixidityString**(`input`: BigNumber.Value): *string*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L87)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *string*

___

### `Const` valueToFrac

▸ **valueToFrac**(`numerator`: BigNumber.Value, `denominator`: BigNumber.Value): *BigNumber‹›*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L93)*

**Parameters:**

Name | Type |
------ | ------ |
`numerator` | BigNumber.Value |
`denominator` | BigNumber.Value |

**Returns:** *BigNumber‹›*

___

### `Const` valueToInt

▸ **valueToInt**(`input`: BigNumber.Value): *number*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L90)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *number*

___

### `Const` valueToString

▸ **valueToString**(`input`: BigNumber.Value): *string*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber.Value |

**Returns:** *string*
