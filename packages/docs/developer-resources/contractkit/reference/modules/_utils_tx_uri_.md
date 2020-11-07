# External module: "utils/tx-uri"

## Index

### Functions

* [QrFromUri](_utils_tx_uri_.md#qrfromuri)
* [buildUri](_utils_tx_uri_.md#builduri)
* [parseUri](_utils_tx_uri_.md#parseuri)

## Functions

###  QrFromUri

▸ **QrFromUri**(`uri`: string, `type`: "svg" | "terminal" | "utf8"): *Promise‹string›*

*Defined in [packages/contractkit/src/utils/tx-uri.ts:112](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-uri.ts#L112)*

**Parameters:**

Name | Type |
------ | ------ |
`uri` | string |
`type` | "svg" &#124; "terminal" &#124; "utf8" |

**Returns:** *Promise‹string›*

___

###  buildUri

▸ **buildUri**(`tx`: Tx, `functionName?`: undefined | string, `abiTypes`: string[]): *string*

*Defined in [packages/contractkit/src/utils/tx-uri.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-uri.ts#L63)*

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

*Defined in [packages/contractkit/src/utils/tx-uri.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-uri.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`uri` | string |

**Returns:** *Tx*
