# utils/formatter

## Index

### Functions

* [hexToNumber](_utils_formatter_.md#hextonumber)
* [inputAddressFormatter](_utils_formatter_.md#inputaddressformatter)
* [inputBlockNumberFormatter](_utils_formatter_.md#inputblocknumberformatter)
* [inputCeloTxFormatter](_utils_formatter_.md#inputcelotxformatter)
* [inputDefaultBlockNumberFormatter](_utils_formatter_.md#inputdefaultblocknumberformatter)
* [inputSignFormatter](_utils_formatter_.md#inputsignformatter)
* [outputBigNumberFormatter](_utils_formatter_.md#outputbignumberformatter)
* [outputBlockFormatter](_utils_formatter_.md#outputblockformatter)
* [outputCeloTxFormatter](_utils_formatter_.md#outputcelotxformatter)
* [outputCeloTxReceiptFormatter](_utils_formatter_.md#outputcelotxreceiptformatter)
* [outputLogFormatter](_utils_formatter_.md#outputlogformatter)

## Functions

### hexToNumber

▸ **hexToNumber**\(`hex?`: undefined \| string\): _number \| undefined_

_Defined in_ [_packages/sdk/connect/src/utils/formatter.ts:159_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L159)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `hex?` | undefined \| string |

**Returns:** _number \| undefined_

### inputAddressFormatter

▸ **inputAddressFormatter**\(`address?`: undefined \| string\): _string \| undefined_

_Defined in_ [_packages/sdk/connect/src/utils/formatter.ts:204_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L204)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | undefined \| string |

**Returns:** _string \| undefined_

### inputBlockNumberFormatter

▸ **inputBlockNumberFormatter**\(`blockNumber`: [BlockNumber](_types_.md#blocknumber)\): _undefined \| string \| number \| BN‹› \| BigNumber‹›_

_Defined in_ [_packages/sdk/connect/src/utils/formatter.ts:109_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L109)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockNumber` | [BlockNumber](_types_.md#blocknumber) |

**Returns:** _undefined \| string \| number \| BN‹› \| BigNumber‹›_

### inputCeloTxFormatter

▸ **inputCeloTxFormatter**\(`tx`: [CeloTx](_types_.md#celotx)\): [_CeloTx_](_types_.md#celotx)

_Defined in_ [_packages/sdk/connect/src/utils/formatter.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L11)

Formats the input of a transaction and converts all values to HEX

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](_types_.md#celotx) |

**Returns:** [_CeloTx_](_types_.md#celotx)

### inputDefaultBlockNumberFormatter

▸ **inputDefaultBlockNumberFormatter**\(`blockNumber`: [BlockNumber](_types_.md#blocknumber) \| null \| undefined\): _undefined \| string \| number \| BN‹› \| BigNumber‹›_

_Defined in_ [_packages/sdk/connect/src/utils/formatter.ts:101_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L101)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockNumber` | [BlockNumber](_types_.md#blocknumber) \| null \| undefined |

**Returns:** _undefined \| string \| number \| BN‹› \| BigNumber‹›_

### inputSignFormatter

▸ **inputSignFormatter**\(`data`: string\): _string_

_Defined in_ [_packages/sdk/connect/src/utils/formatter.ts:214_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L214)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** _string_

### outputBigNumberFormatter

▸ **outputBigNumberFormatter**\(`hex`: string\): _string_

_Defined in_ [_packages/sdk/connect/src/utils/formatter.ts:200_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L200)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `hex` | string |

**Returns:** _string_

### outputBlockFormatter

▸ **outputBlockFormatter**\(`block`: any\): _Block_

_Defined in_ [_packages/sdk/connect/src/utils/formatter.ts:127_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L127)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `block` | any |

**Returns:** _Block_

### outputCeloTxFormatter

▸ **outputCeloTxFormatter**\(`tx`: any\): [_CeloTxPending_](_types_.md#celotxpending)

_Defined in_ [_packages/sdk/connect/src/utils/formatter.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L38)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | any |

**Returns:** [_CeloTxPending_](_types_.md#celotxpending)

### outputCeloTxReceiptFormatter

▸ **outputCeloTxReceiptFormatter**\(`receipt`: any\): [_CeloTxReceipt_](_types_.md#celotxreceipt)

_Defined in_ [_packages/sdk/connect/src/utils/formatter.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L72)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `receipt` | any |

**Returns:** [_CeloTxReceipt_](_types_.md#celotxreceipt)

### outputLogFormatter

▸ **outputLogFormatter**\(`log`: any\): _Log_

_Defined in_ [_packages/sdk/connect/src/utils/formatter.ts:166_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L166)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `log` | any |

**Returns:** _Log_

