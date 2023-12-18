[@celo/connect](../README.md) › [Globals](../globals.md) › ["utils/formatter"](_utils_formatter_.md)

# Module: "utils/formatter"

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
* [outputBlockHeaderFormatter](_utils_formatter_.md#outputblockheaderformatter)
* [outputCeloTxFormatter](_utils_formatter_.md#outputcelotxformatter)
* [outputCeloTxReceiptFormatter](_utils_formatter_.md#outputcelotxreceiptformatter)
* [outputLogFormatter](_utils_formatter_.md#outputlogformatter)

## Functions

###  hexToNumber

▸ **hexToNumber**(`hex?`: undefined | string): *number | undefined*

*Defined in [utils/formatter.ts:171](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L171)*

**Parameters:**

Name | Type |
------ | ------ |
`hex?` | undefined &#124; string |

**Returns:** *number | undefined*

___

###  inputAddressFormatter

▸ **inputAddressFormatter**(`address?`: undefined | string): *string | undefined*

*Defined in [utils/formatter.ts:216](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L216)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | undefined &#124; string |

**Returns:** *string | undefined*

___

###  inputBlockNumberFormatter

▸ **inputBlockNumberFormatter**(`blockNumber`: [BlockNumber](_types_.md#blocknumber)): *undefined | string | number | BN‹› | BigNumber‹›*

*Defined in [utils/formatter.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L117)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | [BlockNumber](_types_.md#blocknumber) |

**Returns:** *undefined | string | number | BN‹› | BigNumber‹›*

___

###  inputCeloTxFormatter

▸ **inputCeloTxFormatter**(`tx`: [CeloTx](_types_.md#celotx)): *[CeloTx](_types_.md#celotx)*

*Defined in [utils/formatter.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L19)*

Formats the input of a transaction and converts all values to HEX

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [CeloTx](_types_.md#celotx) |

**Returns:** *[CeloTx](_types_.md#celotx)*

___

###  inputDefaultBlockNumberFormatter

▸ **inputDefaultBlockNumberFormatter**(`blockNumber`: [BlockNumber](_types_.md#blocknumber) | null | undefined): *undefined | string | number | BN‹› | BigNumber‹›*

*Defined in [utils/formatter.ts:109](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L109)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | [BlockNumber](_types_.md#blocknumber) &#124; null &#124; undefined |

**Returns:** *undefined | string | number | BN‹› | BigNumber‹›*

___

###  inputSignFormatter

▸ **inputSignFormatter**(`data`: string): *string*

*Defined in [utils/formatter.ts:226](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L226)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *string*

___

###  outputBigNumberFormatter

▸ **outputBigNumberFormatter**(`hex`: string): *string*

*Defined in [utils/formatter.ts:212](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L212)*

**Parameters:**

Name | Type |
------ | ------ |
`hex` | string |

**Returns:** *string*

___

###  outputBlockFormatter

▸ **outputBlockFormatter**(`block`: any): *Block*

*Defined in [utils/formatter.ts:150](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L150)*

**Parameters:**

Name | Type |
------ | ------ |
`block` | any |

**Returns:** *Block*

___

###  outputBlockHeaderFormatter

▸ **outputBlockHeaderFormatter**(`blockHeader`: any): *BlockHeader*

*Defined in [utils/formatter.ts:135](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L135)*

**Parameters:**

Name | Type |
------ | ------ |
`blockHeader` | any |

**Returns:** *BlockHeader*

___

###  outputCeloTxFormatter

▸ **outputCeloTxFormatter**(`tx`: any): *[CeloTxPending](_types_.md#celotxpending)*

*Defined in [utils/formatter.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | any |

**Returns:** *[CeloTxPending](_types_.md#celotxpending)*

___

###  outputCeloTxReceiptFormatter

▸ **outputCeloTxReceiptFormatter**(`receipt`: any): *[CeloTxReceipt](_types_.md#celotxreceipt)*

*Defined in [utils/formatter.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L80)*

**Parameters:**

Name | Type |
------ | ------ |
`receipt` | any |

**Returns:** *[CeloTxReceipt](_types_.md#celotxreceipt)*

___

###  outputLogFormatter

▸ **outputLogFormatter**(`log`: any): *Log*

*Defined in [utils/formatter.ts:178](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L178)*

**Parameters:**

Name | Type |
------ | ------ |
`log` | any |

**Returns:** *Log*
