# External module: "utils/tx-uri"

## Index

### Functions

* [QrFromUri](_utils_tx_uri_.md#qrfromuri)
* [buildUri](_utils_tx_uri_.md#builduri)
* [parseUri](_utils_tx_uri_.md#parseuri)

## Functions

###  QrFromUri

▸ **QrFromUri**(`uri`: string, `type`: "svg" | "terminal" | "utf8"): *Promise‹string›*

*Defined in [contractkit/src/utils/tx-uri.ts:107](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-uri.ts#L107)*

**Parameters:**

Name | Type |
------ | ------ |
`uri` | string |
`type` | "svg" &#124; "terminal" &#124; "utf8" |

**Returns:** *Promise‹string›*

___

###  buildUri

▸ **buildUri**(`tx`: Tx, `functionName?`: undefined | string, `abiTypes`: string[]): *string*

*Defined in [contractkit/src/utils/tx-uri.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-uri.ts#L62)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`tx` | Tx | - |
`functionName?` | undefined &#124; string | - |
`abiTypes` | string[] | [] |

**Returns:** *string*

___

###  parseUri

▸ **parseUri**(`uri`: string): *Tx*

*Defined in [contractkit/src/utils/tx-uri.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-uri.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`uri` | string |

**Returns:** *Tx*
