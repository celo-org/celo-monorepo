# wrappers/BaseWrapper

## Index

### Classes

* [BaseWrapper]()

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

▸ **blocksToDurationString**\(`input`: BigNumber.Value\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:125_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L125)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber.Value |

**Returns:** _string_

### `Const` bufferToSolidityBytes

▸ **bufferToSolidityBytes**\(`input`: Buffer\): _SolidityBytes_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:135_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L135)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | Buffer |

**Returns:** _SolidityBytes_

### `Const` fixidityValueToBigNumber

▸ **fixidityValueToBigNumber**\(`input`: BigNumber.Value\): _BigNumber‹›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:63_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L63)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber.Value |

**Returns:** _BigNumber‹›_

### `Const` identity

▸ **identity**&lt;**A**&gt;\(`a`: A\): _A_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:150_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L150)

Identity Parser

**Type parameters:**

▪ **A**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `a` | A |

**Returns:** _A_

### proxyCall

▸ **proxyCall**&lt;**InputArgs**, **ParsedInputArgs**, **PreParsedOutput**, **Output**&gt;\(`methodFn`: Method‹ParsedInputArgs, PreParsedOutput›, `parseInputArgs`: function, `parseOutput`: function\): _function_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:219_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L219)

Creates a proxy to call a web3 native contract method.

There are 4 cases:

* methodFn
* parseInputArgs =&gt; methodFn
* parseInputArgs =&gt; methodFn =&gt; parseOutput
* methodFn =&gt; parseOutput

**Type parameters:**

▪ **InputArgs**: _any\[\]_

▪ **ParsedInputArgs**: _any\[\]_

▪ **PreParsedOutput**

▪ **Output**

**Parameters:**

▪ **methodFn**: _Method‹ParsedInputArgs, PreParsedOutput›_

Web3 methods function

▪ **parseInputArgs**: _function_

parseInputArgs function, tranforms arguments into `methodFn` expected inputs

▸ \(...`args`: InputArgs\): _ParsedInputArgs_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

▪ **parseOutput**: _function_

parseOutput function, transforms `methodFn` output into proxy return

▸ \(`o`: PreParsedOutput\): _Output_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `o` | PreParsedOutput |

**Returns:** _function_

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

▸ **proxyCall**&lt;**InputArgs**, **PreParsedOutput**, **Output**&gt;\(`methodFn`: Method‹InputArgs, PreParsedOutput›, `x`: undefined, `parseOutput`: function\): _function_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:229_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L229)

**Type parameters:**

▪ **InputArgs**: _any\[\]_

▪ **PreParsedOutput**

▪ **Output**

**Parameters:**

▪ **methodFn**: _Method‹InputArgs, PreParsedOutput›_

▪ **x**: _undefined_

▪ **parseOutput**: _function_

▸ \(`o`: PreParsedOutput\): _Output_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `o` | PreParsedOutput |

**Returns:** _function_

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

▸ **proxyCall**&lt;**InputArgs**, **ParsedInputArgs**, **Output**&gt;\(`methodFn`: Method‹ParsedInputArgs, Output›, `parseInputArgs`: function\): _function_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:234_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L234)

**Type parameters:**

▪ **InputArgs**: _any\[\]_

▪ **ParsedInputArgs**: _any\[\]_

▪ **Output**

**Parameters:**

▪ **methodFn**: _Method‹ParsedInputArgs, Output›_

▪ **parseInputArgs**: _function_

▸ \(...`args`: InputArgs\): _ParsedInputArgs_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

**Returns:** _function_

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

▸ **proxyCall**&lt;**InputArgs**, **Output**&gt;\(`methodFn`: Method‹InputArgs, Output›\): _function_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:238_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L238)

**Type parameters:**

▪ **InputArgs**: _any\[\]_

▪ **Output**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `methodFn` | Method‹InputArgs, Output› |

**Returns:** _function_

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### proxySend

▸ **proxySend**&lt;**InputArgs**, **ParsedInputArgs**, **Output**&gt;\(`kit`: [ContractKit](), ...`sendArgs`: ProxySendArgs‹InputArgs, ParsedInputArgs, Output›\): _function_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:299_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L299)

Creates a proxy to send a tx on a web3 native contract method.

There are 2 cases:

* call methodFn \(no pre or post parsing\)
* preParse arguments & call methodFn

**Type parameters:**

▪ **InputArgs**: _any\[\]_

▪ **ParsedInputArgs**: _any\[\]_

▪ **Output**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `...sendArgs` | ProxySendArgs‹InputArgs, ParsedInputArgs, Output› |

**Returns:** _function_

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### secondsToDurationString

▸ **secondsToDurationString**\(`durationSeconds`: BigNumber.Value, `outputUnits`: TimeUnit\[\]\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:96_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L96)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `durationSeconds` | BigNumber.Value | - |
| `outputUnits` | TimeUnit\[\] | \['year', 'month', 'week', 'day', 'hour', 'minute', 'second'\] |

**Returns:** _string_

### `Const` solidityBytesToString

▸ **solidityBytesToString**\(`input`: SolidityBytes\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:136_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L136)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | SolidityBytes |

**Returns:** _string_

### `Const` stringIdentity

▸ **stringIdentity**\(`x`: string\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:151_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L151)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `x` | string |

**Returns:** _string_

### `Const` stringToSolidityBytes

▸ **stringToSolidityBytes**\(`input`: string\): _SolidityBytes_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:134_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L134)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | string |

**Returns:** _SolidityBytes_

### tupleParser

▸ **tupleParser**&lt;**A0**, **B0**&gt;\(`parser0`: Parser‹A0, B0›\): _function_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L157)

Tuple parser Useful to map different input arguments

**Type parameters:**

▪ **A0**

▪ **B0**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `parser0` | Parser‹A0, B0› |

**Returns:** _function_

▸ \(...`args`: \[A0\]\): _\[B0\]_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | \[A0\] |

▸ **tupleParser**&lt;**A0**, **B0**, **A1**, **B1**&gt;\(`parser0`: Parser‹A0, B0›, `parser1`: Parser‹A1, B1›\): _function_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:158_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L158)

**Type parameters:**

▪ **A0**

▪ **B0**

▪ **A1**

▪ **B1**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `parser0` | Parser‹A0, B0› |
| `parser1` | Parser‹A1, B1› |

**Returns:** _function_

▸ \(...`args`: \[A0, A1\]\): _\[B0, B1\]_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | \[A0, A1\] |

▸ **tupleParser**&lt;**A0**, **B0**, **A1**, **B1**, **A2**, **B2**&gt;\(`parser0`: Parser‹A0, B0›, `parser1`: Parser‹A1, B1›, `parser2`: Parser‹A2, B2›\): _function_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:162_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L162)

**Type parameters:**

▪ **A0**

▪ **B0**

▪ **A1**

▪ **B1**

▪ **A2**

▪ **B2**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `parser0` | Parser‹A0, B0› |
| `parser1` | Parser‹A1, B1› |
| `parser2` | Parser‹A2, B2› |

**Returns:** _function_

▸ \(...`args`: \[A0, A1, A2\]\): _\[B0, B1, B2\]_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | \[A0, A1, A2\] |

▸ **tupleParser**&lt;**A0**, **B0**, **A1**, **B1**, **A2**, **B2**, **A3**, **B3**&gt;\(`parser0`: Parser‹A0, B0›, `parser1`: Parser‹A1, B1›, `parser2`: Parser‹A2, B2›, `parser3`: Parser‹A3, B3›\): _function_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:167_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L167)

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

| Name | Type |
| :--- | :--- |
| `parser0` | Parser‹A0, B0› |
| `parser1` | Parser‹A1, B1› |
| `parser2` | Parser‹A2, B2› |
| `parser3` | Parser‹A3, B3› |

**Returns:** _function_

▸ \(...`args`: \[A0, A1, A2, A3\]\): _\[B0, B1, B2, B3\]_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | \[A0, A1, A2, A3\] |

### `Const` unixSecondsTimestampToDateString

▸ **unixSecondsTimestampToDateString**\(`input`: BigNumber.Value\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:128_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L128)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber.Value |

**Returns:** _string_

### `Const` valueToBigNumber

▸ **valueToBigNumber**\(`input`: BigNumber.Value\): _BigNumber‹›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber.Value |

**Returns:** _BigNumber‹›_

### `Const` valueToFixidityString

▸ **valueToFixidityString**\(`input`: BigNumber.Value\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:67_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L67)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber.Value |

**Returns:** _string_

### `Const` valueToFrac

▸ **valueToFrac**\(`numerator`: BigNumber.Value, `denominator`: BigNumber.Value\): _BigNumber‹›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:75_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L75)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `numerator` | BigNumber.Value |
| `denominator` | BigNumber.Value |

**Returns:** _BigNumber‹›_

### `Const` valueToInt

▸ **valueToInt**\(`input`: BigNumber.Value\): _number_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L70)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber.Value |

**Returns:** _number_

### `Const` valueToString

▸ **valueToString**\(`input`: BigNumber.Value\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L65)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber.Value |

**Returns:** _string_

