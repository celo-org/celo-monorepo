# wrappers/BaseWrapper

## Index

### Classes

* [BaseWrapper]()
* [CeloTransactionObject]()

### Interfaces

* [Filter]()

### Type aliases

* [CeloTransactionParams](_wrappers_basewrapper_.md#celotransactionparams)

### Variables

* [stringToBuffer](_wrappers_basewrapper_.md#const-stringtobuffer)

### Functions

* [bufferToBytes](_wrappers_basewrapper_.md#const-buffertobytes)
* [bufferToString](_wrappers_basewrapper_.md#const-buffertostring)
* [bytesToString](_wrappers_basewrapper_.md#const-bytestostring)
* [fixidityValueToBigNumber](_wrappers_basewrapper_.md#const-fixidityvaluetobignumber)
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

### CeloTransactionParams

Ƭ **CeloTransactionParams**: _Omit‹Tx, "data"›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:241_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L241)

## Variables

### `Const` stringToBuffer

• **stringToBuffer**: _function_ = hexToBuffer

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:53_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L53)

#### Type declaration:

▸ \(`input`: string\): _Buffer_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | string |

## Functions

### `Const` bufferToBytes

▸ **bufferToBytes**\(`input`: Buffer\): _string \| number\[\]_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:63_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L63)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | Buffer |

**Returns:** _string \| number\[\]_

### `Const` bufferToString

▸ **bufferToString**\(`buf`: Buffer\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L55)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `buf` | Buffer |

**Returns:** _string_

### `Const` bytesToString

▸ **bytesToString**\(`input`: SolBytes\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L65)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | SolBytes |

**Returns:** _string_

### `Const` fixidityValueToBigNumber

▸ **fixidityValueToBigNumber**\(`input`: BigNumber.Value\): _BigNumber‹›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L38)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber.Value |

**Returns:** _BigNumber‹›_

### `Const` identity

▸ **identity**&lt;**A**&gt;\(`a`: A\): _A_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L70)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:139_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L139)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:149_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L149)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:154_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L154)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:158_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L158)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:219_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L219)

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

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### `Const` stringIdentity

▸ **stringIdentity**\(`x`: string\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L71)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `x` | string |

**Returns:** _string_

### `Const` stringToBytes

▸ **stringToBytes**\(`input`: string\): _string \| number\[\]_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L61)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | string |

**Returns:** _string \| number\[\]_

### toTransactionObject

▸ **toTransactionObject**&lt;**O**&gt;\(`kit`: [ContractKit](), `txo`: TransactionObject‹O›, `defaultParams?`: Omit‹Tx, "data"›\): [_CeloTransactionObject_]()_‹O›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:233_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L233)

**Type parameters:**

▪ **O**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `txo` | TransactionObject‹O› |
| `defaultParams?` | Omit‹Tx, "data"› |

**Returns:** [_CeloTransactionObject_]()_‹O›_

### tupleParser

▸ **tupleParser**&lt;**A0**, **B0**&gt;\(`parser0`: Parser‹A0, B0›\): _function_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:77_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L77)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:78_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L78)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:82_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L82)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:87_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L87)

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

### `Const` valueToBigNumber

▸ **valueToBigNumber**\(`input`: BigNumber.Value\): _BigNumber‹›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber.Value |

**Returns:** _BigNumber‹›_

### `Const` valueToFixidityString

▸ **valueToFixidityString**\(`input`: BigNumber.Value\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber.Value |

**Returns:** _string_

### `Const` valueToFrac

▸ **valueToFrac**\(`numerator`: BigNumber.Value, `denominator`: BigNumber.Value\): _BigNumber‹›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:50_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L50)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `numerator` | BigNumber.Value |
| `denominator` | BigNumber.Value |

**Returns:** _BigNumber‹›_

### `Const` valueToInt

▸ **valueToInt**\(`input`: BigNumber.Value\): _number_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:45_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L45)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber.Value |

**Returns:** _number_

### `Const` valueToString

▸ **valueToString**\(`input`: BigNumber.Value\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber.Value |

**Returns:** _string_

