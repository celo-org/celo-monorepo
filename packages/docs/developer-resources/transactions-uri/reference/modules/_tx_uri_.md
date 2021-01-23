# Module: "tx-uri"

## Index

### Functions

* [QrFromUri](_tx_uri_.md#qrfromuri)
* [buildUri](_tx_uri_.md#builduri)
* [parseUri](_tx_uri_.md#parseuri)

## Functions

###  QrFromUri

▸ **QrFromUri**(`uri`: string, `type`: "svg" | "terminal" | "utf8"): *Promise‹string›*

*Defined in [tx-uri.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/transactions-uri/src/tx-uri.ts#L114)*

**Parameters:**

Name | Type |
------ | ------ |
`uri` | string |
`type` | "svg" &#124; "terminal" &#124; "utf8" |

**Returns:** *Promise‹string›*

___

###  buildUri

▸ **buildUri**(`tx`: CeloTx, `functionName?`: undefined | string, `abiTypes`: string[]): *string*

*Defined in [tx-uri.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/transactions-uri/src/tx-uri.ts#L65)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`tx` | CeloTx | - |
`functionName?` | undefined &#124; string | - |
`abiTypes` | string[] | [] |

**Returns:** *string*

___

###  parseUri

▸ **parseUri**(`uri`: string): *CeloTx*

*Defined in [tx-uri.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/transactions-uri/src/tx-uri.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`uri` | string |

**Returns:** *CeloTx*
