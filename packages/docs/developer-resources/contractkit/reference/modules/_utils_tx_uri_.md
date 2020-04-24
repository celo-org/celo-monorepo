# External module: "utils/tx-uri"

## Index

### Functions

* [QrFromUri](_utils_tx_uri_.md#qrfromuri)
* [buildUri](_utils_tx_uri_.md#builduri)
* [parseUri](_utils_tx_uri_.md#parseuri)

## Functions

###  QrFromUri

▸ **QrFromUri**(`uri`: string, `type`: "svg" | "terminal" | "utf8"): *Promise‹string›*

*Defined in [contractkit/src/utils/tx-uri.ts:113](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-uri.ts#L113)*

**Parameters:**

Name | Type |
------ | ------ |
`uri` | string |
`type` | "svg" &#124; "terminal" &#124; "utf8" |

**Returns:** *Promise‹string›*

___

###  buildUri

▸ **buildUri**(`tx`: Tx, `functionName?`: undefined | string, `abiTypes?`: string[]): *string*

*Defined in [contractkit/src/utils/tx-uri.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-uri.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |
`functionName?` | undefined &#124; string |
`abiTypes?` | string[] |

**Returns:** *string*

___

###  parseUri

▸ **parseUri**(`uri`: string): *Tx*

*Defined in [contractkit/src/utils/tx-uri.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-uri.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`uri` | string |

**Returns:** *Tx*
