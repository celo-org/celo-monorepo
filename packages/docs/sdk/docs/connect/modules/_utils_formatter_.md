[@celo/connect](../README.md) › [Globals](../globals.md) › ["utils/formatter"](_utils_formatter_.md)

# Module: "utils/formatter"

## Index

### Functions

* [hexToNumber](_utils_formatter_.md#hextonumber)
* [inputAccessListFormatter](_utils_formatter_.md#inputaccesslistformatter)
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
* [parseAccessList](_utils_formatter_.md#parseaccesslist)

## Functions

###  hexToNumber

▸ **hexToNumber**(`hex?`: undefined | string): *number | undefined*

*Defined in [utils/formatter.ts:223](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L223)*

**Parameters:**

Name | Type |
------ | ------ |
`hex?` | undefined &#124; string |

**Returns:** *number | undefined*

___

###  inputAccessListFormatter

▸ **inputAccessListFormatter**(`accessList?`: AccessList): *[AccessListRaw](_types_.md#accesslistraw)*

*Defined in [utils/formatter.ts:303](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L303)*

**Parameters:**

Name | Type |
------ | ------ |
`accessList?` | AccessList |

**Returns:** *[AccessListRaw](_types_.md#accesslistraw)*

___

###  inputAddressFormatter

▸ **inputAddressFormatter**(`address?`: undefined | string): *StrongAddress | undefined*

*Defined in [utils/formatter.ts:320](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L320)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | undefined &#124; string |

**Returns:** *StrongAddress | undefined*

___

###  inputBlockNumberFormatter

▸ **inputBlockNumberFormatter**(`blockNumber`: [BlockNumber](_types_.md#blocknumber)): *[inputBlockNumberFormatter](_utils_formatter_.md#inputblocknumberformatter)*

*Defined in [utils/formatter.ts:168](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L168)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | [BlockNumber](_types_.md#blocknumber) |

**Returns:** *[inputBlockNumberFormatter](_utils_formatter_.md#inputblocknumberformatter)*

___

###  inputCeloTxFormatter

▸ **inputCeloTxFormatter**(`tx`: [CeloTx](_types_.md#celotx)): *[FormattedCeloTx](../interfaces/_types_.formattedcelotx.md)*

*Defined in [utils/formatter.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L23)*

Formats the input of a transaction and converts all values to HEX

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [CeloTx](_types_.md#celotx) |

**Returns:** *[FormattedCeloTx](../interfaces/_types_.formattedcelotx.md)*

___

###  inputDefaultBlockNumberFormatter

▸ **inputDefaultBlockNumberFormatter**(`blockNumber`: [BlockNumber](_types_.md#blocknumber) | null | undefined): *[inputDefaultBlockNumberFormatter](_utils_formatter_.md#inputdefaultblocknumberformatter)*

*Defined in [utils/formatter.ts:160](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L160)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | [BlockNumber](_types_.md#blocknumber) &#124; null &#124; undefined |

**Returns:** *[inputDefaultBlockNumberFormatter](_utils_formatter_.md#inputdefaultblocknumberformatter)*

___

###  inputSignFormatter

▸ **inputSignFormatter**(`data`: string): *[inputSignFormatter](_utils_formatter_.md#inputsignformatter)*

*Defined in [utils/formatter.ts:330](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L330)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *[inputSignFormatter](_utils_formatter_.md#inputsignformatter)*

___

###  outputBigNumberFormatter

▸ **outputBigNumberFormatter**(`hex`: string): *string*

*Defined in [utils/formatter.ts:264](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L264)*

**Parameters:**

Name | Type |
------ | ------ |
`hex` | string |

**Returns:** *string*

___

###  outputBlockFormatter

▸ **outputBlockFormatter**(`block`: any): *Block*

*Defined in [utils/formatter.ts:202](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L202)*

**Parameters:**

Name | Type |
------ | ------ |
`block` | any |

**Returns:** *Block*

___

###  outputBlockHeaderFormatter

▸ **outputBlockHeaderFormatter**(`blockHeader`: any): *BlockHeader*

*Defined in [utils/formatter.ts:187](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L187)*

**Parameters:**

Name | Type |
------ | ------ |
`blockHeader` | any |

**Returns:** *BlockHeader*

___

###  outputCeloTxFormatter

▸ **outputCeloTxFormatter**(`tx`: any): *[CeloTxPending](_types_.md#celotxpending)*

*Defined in [utils/formatter.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | any |

**Returns:** *[CeloTxPending](_types_.md#celotxpending)*

___

###  outputCeloTxReceiptFormatter

▸ **outputCeloTxReceiptFormatter**(`receipt`: any): *[CeloTxReceipt](_types_.md#celotxreceipt)*

*Defined in [utils/formatter.ts:131](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L131)*

**Parameters:**

Name | Type |
------ | ------ |
`receipt` | any |

**Returns:** *[CeloTxReceipt](_types_.md#celotxreceipt)*

___

###  outputLogFormatter

▸ **outputLogFormatter**(`log`: any): *Log*

*Defined in [utils/formatter.ts:230](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L230)*

**Parameters:**

Name | Type |
------ | ------ |
`log` | any |

**Returns:** *Log*

___

###  parseAccessList

▸ **parseAccessList**(`accessListRaw`: [AccessListRaw](_types_.md#accesslistraw) | undefined): *AccessList*

*Defined in [utils/formatter.ts:272](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/formatter.ts#L272)*

**Parameters:**

Name | Type |
------ | ------ |
`accessListRaw` | [AccessListRaw](_types_.md#accesslistraw) &#124; undefined |

**Returns:** *AccessList*
