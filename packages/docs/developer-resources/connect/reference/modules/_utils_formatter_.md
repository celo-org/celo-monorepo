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
* [outputCeloTxFormatter](_utils_formatter_.md#outputcelotxformatter)
* [outputCeloTxReceiptFormatter](_utils_formatter_.md#outputcelotxreceiptformatter)
* [outputLogFormatter](_utils_formatter_.md#outputlogformatter)

## Functions

###  hexToNumber

▸ **hexToNumber**(`hex?`: undefined | string): *number | undefined*

*Defined in [packages/sdk/connect/src/utils/formatter.ts:159](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L159)*

**Parameters:**

Name | Type |
------ | ------ |
`hex?` | undefined &#124; string |

**Returns:** *number | undefined*

___

###  inputAddressFormatter

▸ **inputAddressFormatter**(`address?`: undefined | string): *string | undefined*

*Defined in [packages/sdk/connect/src/utils/formatter.ts:204](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L204)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | undefined &#124; string |

**Returns:** *string | undefined*

___

###  inputBlockNumberFormatter

▸ **inputBlockNumberFormatter**(`blockNumber`: [BlockNumber](_types_.md#blocknumber)): *undefined | string | number | BN‹› | BigNumber‹›*

*Defined in [packages/sdk/connect/src/utils/formatter.ts:109](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L109)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | [BlockNumber](_types_.md#blocknumber) |

**Returns:** *undefined | string | number | BN‹› | BigNumber‹›*

___

###  inputCeloTxFormatter

▸ **inputCeloTxFormatter**(`tx`: [CeloTx](_types_.md#celotx)): *[CeloTx](_types_.md#celotx)*

*Defined in [packages/sdk/connect/src/utils/formatter.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L11)*

Formats the input of a transaction and converts all values to HEX

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [CeloTx](_types_.md#celotx) |

**Returns:** *[CeloTx](_types_.md#celotx)*

___

###  inputDefaultBlockNumberFormatter

▸ **inputDefaultBlockNumberFormatter**(`blockNumber`: [BlockNumber](_types_.md#blocknumber) | null | undefined): *undefined | string | number | BN‹› | BigNumber‹›*

*Defined in [packages/sdk/connect/src/utils/formatter.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | [BlockNumber](_types_.md#blocknumber) &#124; null &#124; undefined |

**Returns:** *undefined | string | number | BN‹› | BigNumber‹›*

___

###  inputSignFormatter

▸ **inputSignFormatter**(`data`: string): *string*

*Defined in [packages/sdk/connect/src/utils/formatter.ts:214](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L214)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *string*

___

###  outputBigNumberFormatter

▸ **outputBigNumberFormatter**(`hex`: string): *string*

*Defined in [packages/sdk/connect/src/utils/formatter.ts:200](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L200)*

**Parameters:**

Name | Type |
------ | ------ |
`hex` | string |

**Returns:** *string*

___

###  outputBlockFormatter

▸ **outputBlockFormatter**(`block`: any): *Block*

*Defined in [packages/sdk/connect/src/utils/formatter.ts:127](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L127)*

**Parameters:**

Name | Type |
------ | ------ |
`block` | any |

**Returns:** *Block*

___

###  outputCeloTxFormatter

▸ **outputCeloTxFormatter**(`tx`: any): *[CeloTxPending](_types_.md#celotxpending)*

*Defined in [packages/sdk/connect/src/utils/formatter.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | any |

**Returns:** *[CeloTxPending](_types_.md#celotxpending)*

___

###  outputCeloTxReceiptFormatter

▸ **outputCeloTxReceiptFormatter**(`receipt`: any): *[CeloTxReceipt](_types_.md#celotxreceipt)*

*Defined in [packages/sdk/connect/src/utils/formatter.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`receipt` | any |

**Returns:** *[CeloTxReceipt](_types_.md#celotxreceipt)*

___

###  outputLogFormatter

▸ **outputLogFormatter**(`log`: any): *Log*

*Defined in [packages/sdk/connect/src/utils/formatter.ts:166](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L166)*

**Parameters:**

Name | Type |
------ | ------ |
`log` | any |

**Returns:** *Log*
